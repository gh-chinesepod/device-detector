var Model = require('./../repositories/_model')
var ciscoModel = new Model('ciscoMonitoring')
var ciscoLocationModel = new Model('ciscoLocationMonitoring')

const mailgun = require('mailgun-js');
const mg = mailgun({ apiKey: process.env.mgKey, domain: process.env.mgDomain });

const helpers = require('../helpers')

module.exports = {
    runCiscoDetector: async function () {

        let newDevices = []

        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        
        let devices = await getArpList();

        // console.log(devices)
        // return;

        const minIdle = new Date(Date.now() - 2 * 60 * 60 * 1000);

        let networkDevices = await ciscoModel.findQuery({ officeLocation: process.env.officeLocation, notification: false })
        // let locations = await ciscoLocationModel.findQuery({ lastActive: { $lt: minIdle } })

        // set all to offline
        await ciscoModel.updateMany(
            { lastActive: { $lt: minIdle } },
            { status: false }
        );

        for (const device of devices) {
            // if (device.vendor === "Cisco Systems, Inc") {

            ciscoModel.upsert(
                { officeLocation: process.env.officeLocation, mac: device.mac },
                {
                    officeLocation: process.env.officeLocation,
                    serverIP: data.ip,
                    status: true,
                    lastActive: new Date(),
                    notification: false,
                    ...device
                }
            )

            // check devices if online before
            // check if new device
            let existDevice = networkDevices.findIndex(d => d.mac === device.mac)

            if (existDevice !== -1) {
                // remove if find in network, if networkDevices has remaining objects this devices represents not in network in the moment
                networkDevices.splice(existDevice, 1);
            } else {
                // add in new device
                newDevices.push(device)
            }

            // }

        }

        let htmlContent = ''

        // remove devices that was already included in the previous notifications
        // networkDevices = await networkDevices
        // if(locations && locations.length > 0){
        //     const location = locations.map(d => d.officeLocation).join(", <br>");
        //     htmlContent += `<br><strong>Office location no recent activities</strong><br>${location}`
        // }

        if (networkDevices && networkDevices.length > 0) {
            const mac = networkDevices.map(d => d.mac).join(", <br>");
            htmlContent += `<br><strong>Missing devices in network</strong><br>${mac}`

            // update notification true
            for (const device of networkDevices) {

                ciscoModel.upsert(
                    { mac: device.mac },
                    {
                        notification: true
                    }
                )
            }
        }

        if (newDevices && newDevices.length > 0) {
            const newmac = newDevices.map(d => d.mac).join(", <br>");
            htmlContent += `<br><strong>Found new devices in network</strong><br>${newmac}`
        }

        // SEND EMAIL NOTIFICATION IF networkDevices is not null or newDevices contains data
        if (htmlContent) {
            const emailData = {
                from: "Device Detector <dev@chinesepod.com>",
                to: [process.env.emailNotification],
                subject: `Device detector notifications ${process.env.officeLocation} - ${new Date().toLocaleDateString('en-US').replace(/\//g, '-')}`,
                html: `This is a notification from ${process.env.officeLocation} network device updates<br><br>${htmlContent}`
            };

            try {
                const body = await mg.messages().send(emailData);

                helpers.sendSQSMessage(htmlContent)
                console.log("Email sent successfully:", body);
            } catch (error) {
                console.error("Error sending email:", error);
            }
        }    
        console.log("########### CISCO DETECTOR FINISHED ##############")

    },

    updateServiceStatus: async function () {

        // server update
        ciscoLocationModel.upsert(
            { officeLocation: process.env.officeLocation },
            {
                officeLocation: process.env.officeLocation,
                lastActive: new Date(),
                status: false
            }
        )
    },

    sendServiceStatus: async function () {

        const minIdle = new Date(Date.now() - 5 * 60 * 1000); // 5min

       
        let offlineServers = await ciscoLocationModel.findQuery(
            { lastActive: { $lt: minIdle } },
            { status: false }
        );

        // set all to true to avoid multiple sms notification
        ciscoLocationModel.updateMany(
            { lastActive: { $lt: minIdle } },
            { status: true }
        );

        // send sqs
        if (offlineServers && offlineServers.length > 0) {
            const servers = offlineServers.map(d => d.officeLocation).join(", <br>");
            let message = `Hi, <br> This is a reminder that the device detector in this location(s) was offline. ${servers}`
            helpers.sendSQSMessage(message) // send to sqs

            const emailData = {
                from: "Device Detector <dev@chinesepod.com>",
                to: [process.env.emailNotification],
                subject: `Device Detector APP notification`,
                html: message
            };

            mg.messages().send(emailData);
        }

        // ciscoLocationModel.upsert(
        //     { officeLocation: process.env.officeLocation },
        //     {
        //         officeLocation: process.env.officeLocation,
        //         lastActive: new Date(),
        //         notification: false
        //     }
        // )
    }


}

async function getArpList() {

    const { exec } = require("child_process");

    return new Promise((resolve, reject) => {
        exec("arp -a", async (err, stdout) => {
            if (err) return reject(err);

            const lines = stdout.split("\n");
            const devices = [];

            for (let l = 0; l < lines.length; l++) {
                let line = lines[l]
                const match = line.match(/\((\d+\.\d+\.\d+\.\d+)\) at ([a-f0-9:]+)/i);
                if (!match) continue;

                const ip = match[1];
                const mac = match[2];
                console.log("wait for 2 sec to cal get vendor")
                await new Promise(r => setTimeout(r, 2000));
                const vendor = await getVendor(mac);

                devices.push({ ip, mac, vendor });
            }

            resolve(devices);
        });
    });
}

async function getVendor(mac) {
    const url = `https://api.maclookup.app/v2/macs/${mac}`;

    //   console.log("======>>>", url)
    const res = await fetch(url);
    const data = await res.json();
    console.log(data)
    return data.company || "Unknown Vendor";

    //   const url = `https://api.macvendors.com/${mac}`;
    //   const res = await fetch(url);
    //   const data = await res.json();
    // return res.text()
}
