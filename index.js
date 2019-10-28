'use strict'

const express = require('express');
const app = express(); 
const bodyParser = require('body-parser');
const merge = require('easy-pdf-merge');
const uuid = require('uuid');
const request = require('request');
const fs = require('fs');

 
app.use(bodyParser.urlencoded({
    extended: true
  }));


app.use(bodyParser.json());

const port = process.env.PORT || 1201;
 
app.get('/',  (req, res) => {
    res.json("Use post method");
})




const download = async (  files, index, inputs, callback) => { 

      const tmep_dest =  `${__dirname}/input/${uuid()}-pdf.pdf`;
      const url = files[index]; 
 
      await request.get(url)
      .on('error', function(err) {
          console.log(err);
          if( files.length === index + 1) {
            callback( inputs );
          } else {
  
            download( files, index + 1, inputs, callback );
          }
      })
      .pipe(fs.createWriteStream(tmep_dest))
      .on('close',( e ) => {
 
        inputs.push( tmep_dest);

        if( files.length === index + 1) {
          callback( inputs );
        } else {

          download( files, index + 1, inputs, callback );
        }


      }); 
 
};
 
 
app.post('/merge',  (req, res) => {
  const { files } = req.body; 
  if( files.length < 2 ) {
    res.json("at least two files");
    return;
  }

  const output = `${__dirname}/output/${uuid()}-pdf.pdf`;

  try {

    download(  files, 0, [],    ( localFiles ) => { 

      merge( localFiles , output, function(err){
        if(err) {
          return console.log(err)
        }

        try {
          for( let each of localFiles ) { 
            fs.unlinkSync( each ); 
          }
        } catch (error) {
          console.log( error );
        }


        console.log('Successfully merged!')



        const stream = fs.createReadStream( output );
        let filename = `${uuid()}-pdf.pdf`; 
        // Be careful of special characters
      
        filename = encodeURIComponent(filename);
        // Ideally this should strip them
      
        res.setHeader('Content-disposition', 'inline; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');
      
        stream.pipe(res);
 
      });



    }) ;
    
  } catch (error) {
    res.status(500).send("error");
  }
  







  console.log( output );




  
   
})
 
app.use((req, res) => {
  res.status(404).send('') //not found
})

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`)
})