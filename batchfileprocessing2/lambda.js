let AWS = require('aws-sdk');
let it=require('imagemagick')
const s3 = new AWS.S3();
const sns=new  AWS.SNS();

const S3_BUCKET_NAME = 'arn:aws:s3:::batchfileprocessing2 ';
const SNS_TOPIC_ARN = 'arn:aws:sns:eu-west-1:819906645383:BatchProcessing ';


exports.handler = function (event, context, callback) {

    console.log(`Batch process triggered at ${event.time}`);
    s3.listObjects({
        'Bucket': S3_BUCKET_NAME,
        'MaxKeys': 100,
        'Prefix': ''
    }).promise()
        .then(data => {
            let numFiles = data.Contents.length;
            let successCount = 0;
            let failedCount = 0;

            console.log(`${numFiles} files found to process`);
            

            console.log(`${numFiles} files found to process`);
            data.Contents.forEach(file => {
                let fileName = file.Key;

                console.log(`Processing File : ${fileName}`);
            
        
         s3.deleteObject({
                    'Bucket': S3_BUCKET_NAME,
                    'Key': fileName
                }, (err, data) => {
                    if (err) {
                        console.log(`Failed to delete file : ${fileName}`, err, err.stack);
                        failedCount++;
                    } else {
                        console.log(`Successfully deleted file ${fileName}`);
                        successCount++;
                    }

                    if ((successCount + failedCount) === numFiles) {
                        // This is the last file. So send the notification.
                        let message = `Processing finished. ${successCount} successful and ${failedCount} failed`;

                        exports.sendNotification(
                            'Processing Finished',
                            message,
                            () => callback(null, "Processing finished & Notification sent"),
                            (err) => callback(err, "Processing finished & Notification failed"));
                    }
                });
            })
})
.catch(err => {
            console.log("Failed to get file list", err, err.stack); // an error occurred
            let message = `Message processing failed due to : ${err}`;


/* 
This function publishes the provided message with subject to the notification
topic and excute the provided onSuccess or onFailure callback handler 
*/
exports.sendNotification = (subject, message, onSuccess, onFailure) => {
    sns.publish({
        Message: message,
        Subject: subject,
        MessageAttributes: {},
        MessageStructure: 'String',
        TopicArn: SNS_TOPIC_ARN
    }).promise()
        .then(data => {
            console.log("Successfully published notification");
            onSuccess();
        })
        .catch(err => {
            console.log("Error occurred while publishing notification", err, err.stack);
            onFailure(err);
        });

}
}
)}