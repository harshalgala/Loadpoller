/*
install:
1) ansible
2) boto
3) boto3
4) export credentials
*/

var http = require('http');
var request = require('request');
var os = require('os');
var express = require('express');
var app = express();
var exec = require('child_process').exec;
// websocket server that website connects to.
var io = require('socket.io')(4000);
//ansible
var Ansible = require('node-ansible');
var ansiblePlaybookCli = require('ansible-playbook-cli-js');

var allIps = [];
var allLines = [];
//
/* TO do:
1) Update timer
2) Update inventory path
3) call scaleup and scale down
*/

//reading inventory
var inventoryPath = "/home/ubuntu/DevOps_Milestone4_Special/inventory";
var fs = require('fs')

//ansible code
var Options = ansiblePlaybookCli.Options;
var AnsiblePlaybook = ansiblePlaybookCli.AnsiblePlaybook;
var options = new Options(
	/* currentWorkingDirectory */
	'/home/ubuntu/DevOps_Milestone4_Special/'
);
var ansiblePlaybook = new AnsiblePlaybook(options);

var lineReader = require('line-reader');

lineReader.eachLine(inventoryPath, function (line, last) {
	var ip = line.substr(0, line.indexOf(' '));
	allIps.push(ip);
	//console.log(allIps);
	// do whatever you want with line...

});

for (var i = 1; i < allIps.length; i++) {
	if (i == (allIps.length - 1)) {
		console.log(allIps[i]);
	}
}
console.log("Polling the instances every 20 seconds");

//requesting all instances
var server = app.listen(4005, function () {
	var host = server.address().address;
	var port = server.address().port;
	var ansibleDir = "/home/ubuntu/DevOps_Milestone4_Special/"
	console.log('Example app listening at http://%s:%s', host, port);

	var requestLoop = setInterval(function () {
		for (var i = 1; i < allIps.length; i++) {
			if (allIps[i] == "") {
				continue;
			}

			var myUrl = "http://" + allIps[i] + ":3000/health";
			console.log("Listening: " + myUrl);
			request(myUrl, {
				json: true
			}, (err, res) => {
				console.log('Requesting for the usage status');
				var cpu_usage = res.body;
				if (cpu_usage > 40) {
					console.log("!!! Alert !!!!\n Scaling Up.\n CPU utilization:" + cpu_usage);
					//ansible code
					ansiblePlaybook.command('-i "localhost," -c local ' + ansibleDir + 'scale.yaml -e "aws_secret_key=' + process.env.AWS_SECRET_KEY + '" -e "aws_access_key=' + process.env.AWS_ACCESS_KEY_ID + '"', function (err, data) {
						console.log('data = ', data);
					});
					ansiblePlaybook.command('-i ' + inventoryPath + ' ' + ansibleDir + 'monitor.yml', function (err, data) {
						console.log('data = ', data);
					});
					//
				} else if ((cpu_usage < 20) && (allIps.length > 3)) {
					//scaledown
					var k = allIps[i] + '';
					lineReader.eachLine(inventoryPath, function (line, last) {
						var wholeline = line.substr(0, line.indexOf('\n'));
						allLines.push(wholeline);
					});

					for (var j = 1; j < allLines.length; j++) {
						if (allLines[j].match(k)) {
							delete allLines[j];
						}
					}

					console.log("!!!Below Threshold!!!\n Scaling down.\n CPU utilization:" + cpu_usage);
					ansiblePlaybook.command('-i ' + inventoryPath + ' ' + ansibleDir + 'scaledown.yaml -e "deletehostip=' + allIps[i] + '"', function (err, data) {
						console.log('data = ', data);
					});
				} else {
					console.log("Running smoothly.\n CPU utilization:" + cpu_usage);
				}
				//console.log(res.body);
				if (err) {
					return console.log(err);
				}
			});
		}
	}, 20000);

});

app.use(function (req, res, next) {
	console.log(req.method, req.url);
	// handle next
	next();
});
app.get('/', function (req, res) {
	res.send('iTrust Surgeon Monkey Running');
});