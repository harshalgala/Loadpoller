var http = require('http');
var request = require('request');
var express = require('express');
var lineReader = require('line-reader');
var exec = require('child_process').exec;
var io = require('socket.io')(3002);
var Ansible = require('node-ansible');
var ansiblePlaybookCli = require('ansible-playbook-cli-js');

// websocket server that website connects to.

var app = express();
var inventoryPath = "/home/harshal/Desktop/Loadpoller/inventory";
var allIps = [];
var Options = ansiblePlaybookCli.Options;
var AnsiblePlaybook = ansiblePlaybookCli.AnsiblePlaybook;
var options = new Options(
    /* currentWorkingDirectory */ 'test'
);
var ansiblePlaybook = new AnsiblePlaybook(options);

/* TO do:
1) Update timer
2) Update inventory path
3) call scaleup and scale down
*/

//reading inventory
lineReader.eachLine(inventoryPath, function (line, last) {
	var ip = line.substr(0, line.indexOf(' '));
	allIps.push(ip);
	console.log(allIps);
});

for (var i = 1; i < allIps.length; i++) {
	//console.log(allIps[i]);
}
//console.log("here..........");

//requesting all instances
var server = app.listen(3001, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);

	var requestLoop = setInterval(function () {
		for (var i = 1; i < allIps.length; i++) {
			if (allIps[i] == "") {
				continue;
			}
			//console.log("listening: "+allIps[i]);

			request('http://' + allIps[i] + '/health', {
				json: true
			}, (err, res) => {
				//console.log('Requesting');
				var cpu_usage = res.body;
				if (cpu_usage > 30) {
					console.log("!!Alert!! CPU utilization:" + cpu_usage);
					ansiblePlaybook.command('thresholdmore.yml -i '+inventoryPath).then(function (data) {
						console.log('data = ', data); 
					  });				  
					
				} else if(cpu_usage< 10){
					console.log("Running smoothly. CPU utilization:" + cpu_usage);
					ansiblePlaybook.command('thresholdless.yml -i '+inventoryPath).then(function (data) {
						console.log('data = ', data); 
					  });					  
				}
				if (err) {
					return console.log(err);
				}
			});
		}
	}, 2000);


});


app.use(function (req, res, next) {
	console.log(req.method, req.url);
	// handle next
	next();
});
app.get('/', function (req, res) {
	res.send('Itrust Doctor Monkey');
});