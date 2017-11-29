/*
install:
1) ansible
2) boto
3) export credentials
*/

var http = require('http');
var request = require('request');
var os = require('os');
var express = require('express');
var app = express();

var exec = require('child_process').exec;

// websocket server that website connects to.
var io = require('socket.io')(3000);
var allIps=[];
//ansible
var Ansible = require('node-ansible');
var ansiblePlaybookCli = require('ansible-playbook-cli-js');
//
/* TO do:
1) Update timer
2) Update inventory path
3) call scaleup and scale down

*/
//reading inventory
var inventoryPath="/home/ubuntu/DevOps_Milestone4_Special/inventory";
fs = require('fs')
//ansible code
var Options = ansiblePlaybookCli.Options;
var AnsiblePlaybook = ansiblePlaybookCli.AnsiblePlaybook;
var options = new Options(
    /* currentWorkingDirectory */ 'test'
);
var ansiblePlaybook = new AnsiblePlaybook(options);

//
/*fs.readFile('/home/hkgurjar/Devops/DevOpsMileStone4/Monitoring/inventory_folder/inventory', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  console.log(data+" *****************");
});*/

var lineReader = require('line-reader');


lineReader.eachLine(inventoryPath, function(line, last) {
  var ip=line.substr(0,line.indexOf(' '));
  allIps.push(ip);
  console.log(allIps);
  // do whatever you want with line...
  
});

/*setTimeout(function() {

}, 5000);*/
//console.log(allIps);
for(var i=1;i<allIps.length;i++){
	console.log(allIps[i]);
}
console.log("here..........");

//requesting all instances
var server = app.listen(3005, function () {
  var host = server.address().address;
  var port = server.address().port;
  var ansibleDir="/home/ubuntu/DevOps_Milestone4_Special/"
  console.log('Example app listening at http://%s:%s', host, port);

  var requestLoop = setInterval(function(){
  	for(var i=1;i<allIps.length;i++){
  	if(allIps[i]==""){
  		continue;
  	}
  	
  	var myUrl="http://"+allIps[i]+":3000/health";
  	console.log("listening: "+myUrl);
	  request(myUrl, { json: true }, ( err, res) => {
	    	console.log('Requesting');
	    	var cpu_usage=res.body;
	    	if(cpu_usage > 40){
	    		console.log("Alert !!!! CPU utilization:"+cpu_usage);
	    		//ansible code
	    		ansiblePlaybook.command('-i "localhost," -c local '+ansibleDir+'scale.yaml').then(function (data) {
						console.log('data = ', data); 
					  });
	    		//
	    	}
	    	else if(cpu_usage<20){
	    		//scaledown
	    		ansiblePlaybook.command('-i '+inventoryPath+' '+ansibleDir+'scale_down.yml -e "deletehostip='+allIps[i]+'"').then(function (data) {
						console.log('data = ', data); 
					  });
	    		console.log("Less load. Scaling down. CPU utilization:"+cpu_usage);
	    	}
	    	else{
	    		console.log("Running smoothly. CPU utilization:"+cpu_usage);
	    	}
	    	//console.log(res.body);
	  		if (err) { 
	  			return console.log(err); 
	  		}
		});
	}
	},2000);

	
});


app.use(function(req, res, next){
	console.log(req.method, req.url);
	// handle next
	next(); 
});
app.get('/', function(req, res) {
  res.send('Itrust Doctor Monkey');
});

