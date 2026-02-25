const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs")

const client = new SQSClient({
  region: process.env.region,
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey
  }
});

const queueUrl = "https://sqs.us-east-1.amazonaws.com/174046339189/messaging";


exports.sendSQSMessage = async (message) => {

    const params = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
            phone: process.env.phoneNotification ?? "+639067222820",
            message: message,
            timestamp: Date.now()
        }),
    };

    // try {
    //     const result = await client.send(new SendMessageCommand(params));
    //     console.log("Message sent:", result.MessageId);
    // } catch (err) {
    //     console.error("Send error:", err);
    // }

}

