const express  = require('express');
const { LanguageServiceClient } = require('@google-cloud/language');
const { ComprehendClient, DetectToxicContentCommand } = require('@aws-sdk/client-comprehend');
const { OpenAI } = require('openai');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
require('dotenv').config({override: true});
const app = express();
app.use(express.json());

app.post('/gcp',async (req,res)=>{
    if(req.body.text && req.body.languageCode){
        const client = new LanguageServiceClient();
        const document = {
            content: req.body.text,
            type: 'PLAIN_TEXT',
            language: req.body.languageCode,
          };
          const result=  await client.moderateText({document: document}).then((result) => {
              console.log(result);
              result.forEach((moderation) => {
                  console.log(moderation);
                  res.json(moderation);
              })
          }).catch((err) => {
              console.log(err);
          });
    }
})
app.post('/aws',async (req,res)=>{
    if(req.body.text && req.body.languageCode){
        const client = new ComprehendClient();
        const input = {
            TextSegments: [{
                Text: req.body.text
            }],
            LanguageCode: req.body.languageCode
        };
        const command = new DetectToxicContentCommand(input);
        const output = [];
        const response = await client.send(command).then((result) => {
            result.ResultList[0].Labels.forEach((moderation) => {
                console.log(moderation);
                output.push(moderation);
            })
            res.json(output);
        }).catch((err) => {
            console.log(err);
        })
    }

})
app.post('/openai',async (req,res)=>{
    if(req.body.text){
        await new OpenAI({apiKey: process.env.OpenAIAPIKey}).moderations.create({
            input: req.body.text
        }).then((result) => {
            result.results.forEach((moderation) => {
                if(moderation.flagged){
                    //moderation.categories.
                }
            })
            res.json(result).status(200);
        }).catch((err) => {
            console.log(err);
            res.send(err).status(500);
        })
    }
})

app.post('/gcp/entity-sentiment-analysis', async (req,res)=>{
    if(req.body.text && req.body.languageCode){
        const document = {
            content: req.body.text,
            type: 'PLAIN_TEXT',
        };
        const client = new LanguageServiceClient();
        const output = [];
        await client.analyzeEntitySentiment({document: document}).then((result) => {
            console.log(result)
            result[0].entities.forEach((entity) => {
                output.push(entity);
            })
            res.json(output);
        }).catch((err) => {
            console.log(err);
        });
    }
})
app.post('/gcp/image-detection',async(req,res)=>{
    const client = new ImageAnnotatorClient();
    const filePath = './Images/Violence4.jpeg';
    const [result] = await client.safeSearchDetection(filePath);
    console.log(result);
    const detections = result.safeSearchAnnotation;
    console.log(detections);
    res.json(detections).status(200);
}).listen(3500)