
/**
 * @class mongoose-visual
 **/

/**
 * @deps
 **/

var fs = require('fs')
  , util = require('util')
  , mongoose = require('mongoose')
  , express = require('express');

var projectModels = []
  , JSONOutput = [];

var HTMLString = '<html><head><title>Mongoose Visuals</title>';
HTMLString += '<link rel="stylesheet" type="text/css" href="/style.css" />';
HTMLString += '</head><body>';

var loadedModels = 0
  , totalModels = 0;
  
function HTMLModel(modelName, keys) {
  HTMLString += '<div class="modelTitle"><code>' + modelName + '</code></div>';
  HTMLString += '<div class="models">';
  HTMLString += '<div id="' + modelName + '">';
  for (key in keys) {
    var name = keys[key].name;
    var type = keys[key].type;
    if (type === 'Boolean') {
      keyClass = 'booleanType'; 
    } else if (type === 'Date') {
      keyClass = 'dateType';
    } else if (type === 'String') {
      keyClass = 'stringType';
    } else if (type === 'Number') {
      keyClass = 'numberType';
    } else {
      keyClass = 'otherType';
    } 
    if (name !== 'id' && name !== '_id') {
      HTMLString += '<div class="holder">';
      HTMLString += '<div class="keyName"><code>' + name + ':</code></div>';
      HTMLString += '<div class="keyType"><code>{ type : ' + '<span class="'+ keyClass + '">' + type + '</span> }</code></div>';
      HTMLString += '</div>';
    }
  }
  HTMLString += '</div></div>';
}

function abstractModel(obj) {
  var modelName = obj.modelName;
  var collectionProtoype = obj.prototype._schema.paths;
  var items = new Array();
  for (obj in collectionProtoype) {
    var itemObject = collectionProtoype[obj];
    var key = {};
    key.name = itemObject.path.toString();
    try {
      key.type = itemObject.options.type.name;
    } catch(error) {
      key.type = 'Empty';
    };
    items.push(key);
  };
  var myModel = {
    ModelName : modelName,
    keys : items
  };
  // JSON
  JSONOutput.push(myModel);
  // HTML
  HTMLModel(modelName, items);
};

/**
 * @description export main
 **/

module.exports = visual = function(args) {
  var jsonFile = args[2] ? args[2] : __dirname + '/../visuals/models.json'
  var htmlFile = args[3] ? args[3] : __dirname + '/../visuals/models.html'
  var cssFile = args[4] ? args[4] : __dirname + '/../visuals/models.css'


  if (args[0] == 'docs') {
    process.on('modelsLoaded', function() {
      // Save JSON
      var writeReady = JSON.stringify(JSONOutput);
      fs.writeFileSync(jsonFile, writeReady, "utf8");
      // Save HTML
      var HTML = HTMLString + '</body></html>';
      fs.writeFileSync(htmlFile, HTML, "utf8");
    });
    var dir = args[1];
    fs.readdir(process.cwd() + dir, function(error, files) {
      if (error) {
        throw new Error(error);
      } else {
        totalModels = files.length;
        files.forEach(function(file) {
          var modelName = file.replace('.js', '');
          var model = require(process.cwd() + dir + modelName)[modelName];
          projectModels[modelName] = model;
          loadedModels++;
          if (loadedModels === totalModels) {
            for (models in projectModels) {
              abstractModel(projectModels[models]);
            }
            process.emit('modelsLoaded', true);
          }
        });   
      }    
    });
  } else if (args[0] === 'server') {
    var app = express.createServer();
    app.get('/', function(request, response) {
      var servingType = 'HTML';
      if (servingType === 'JSON') {
        var UTF8String = fs.readFileSync(jsonFile, 'utf8');
        var modelsJSON = JSON.parse(UTF8String);
        response.send(modelsJSON);
      } else if (servingType === 'HTML') {
        var HTML = fs.readFileSync(htmlFile, 'utf8');
        response.writeHead(200, { 'Content-Type' : 'text/html' });
        response.end(HTML);
      }
    });
    app.get('/style.css', function(request, response) {
      var CSS = fs.readFileSync(__dirname + '/../visuals/style.css', 'utf8');
      response.writeHead(200, { 'Content-Type' : 'text/css' });
      response.end(CSS);
    });
    app.listen(8000);
    console.log('> mongoose visual listening on: http://localhost:8000/');
  } else {
    console.log('> Unknown command, try: "mongoosevisual docs /models-path/" or: "mongoosevisual server"');
  }
};

/* EOF */