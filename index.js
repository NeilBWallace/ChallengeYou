const Express = require ('express')
const App = Express ()
const Request = require ('request')
const ZiggeoSdk = require ('ziggeo')
const Fs = require ('fs')
var path = require('path');
var bodyParser = require('body-parser');
var passport= require('passport');
var localStrategy= require('passport-local').strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');

require ('dotenv').config ()

ZiggeoSdk.init ('r1e4a85dd1e7c33391c1514d6803b975', process.env.PRIVATE_KEY)

App.use(morgan('dev'));
App.use(cookieParser());
App.use(session({secret:'anystring',saveuninitialized:true,resave:true}));
App.use(bodyParser.urlencoded({extended:true}));



App.engine ('ejs', require('ejs-locals'));
App.set ('view engine', 'ejs')

App.get ('/', function (req, res) {
  	res.render('home', {
  		page_title: 'Challenge You',
  		need_ziggeo: 0
  	})
})

App.get ('/videos', function (req, res){
	
	ZiggeoSdk.Videos.index ({limit:100}, {
		success: function (index) {
			res.render('videos', {
				ziggeo_api_token: process.env.API_TOKEN,
				page_title: 'All Videos',
				need_ziggeo: 1,
				videos: index
			})
			return true;
		},
		failure: function (args, error) {
			console.log("failed: " + error);
			renderError(1)
			return false;
		}
	});
})

App.get ('/video/:videoId', function (req, res){
	var video_id = req.params.videoId
	res.render ('video',{
		ziggeo_api_token: process.env.API_TOKEN,
		page_title: 'Video',
		video_id: video_id,
		need_ziggeo: 1
	})
})

App.get ('/video/:videoId/stream/:stream_id', function (req, res){
	var video_id = req.params.videoId
	var stream_id = req.params.stream_id
	res.render ('stream',{
		ziggeo_api_token: process.env.API_TOKEN,
		page_title: 'Single stream ',
		video_id: video_id,
		stream_id: stream_id,
		need_ziggeo: 1
	})
})

App.delete ('/video/:videoId', function (req, res){
	var video_id = req.params.videoId
	ZiggeoSdk.Videos.destroy (video_id, function (data){
		res.send('ok')
	})
})

App.get ('/streams/:videoId', function (req, res){
	var video_id = req.params.videoId
	ZiggeoSdk.Streams.index(video_id, {states:"ready"}, {
		success: function(index){
			res.render('streams', {
				ziggeo_api_token: process.env.API_TOKEN,
				page_title: 'Ziggeo Single Streams',
				need_ziggeo: 1,
				video_token: video_id,
				videos: index
			})	
		},
		failure: function(){
			
		}
	})
})

App.get ('/record', function (req, res){
	res.render ('record',{
		ziggeo_api_token: process.env.API_TOKEN,
		page_title: 'Record video',
		need_ziggeo: 1
	})
})

App.get ('/upload', function (req, res){
	res.render ('upload',{
		ziggeo_api_token: process.env.API_TOKEN,
		page_title: 'Upload video with Ziggeo version 2',
		need_ziggeo: 1
	})
})

App.get ('/approve', function (req, res){
	ZiggeoSdk.Videos.index ({limit:100}, {
		success: function (index) {
			res.render('approve', {
				ziggeo_api_token: process.env.API_TOKEN,
				page_title: 'Approve Videos',
				need_ziggeo: 1,
				videos: index
			})
			return true;
		},
		failure: function (args, error) {
			console.log("failed: " + error);
			renderError(1)
			return false;
		}
	});
})

App.post ('/approve/:video_id', function (req, res){
	var video_id = req.params.video_id
	ZiggeoSdk.Videos.update(video_id,{
		approved: true
	}, function (data){
		res.send('ok')
	})
})

App.post ('/reject/:video_id', function (req, res){
	var video_id = req.params.video_id
	ZiggeoSdk.Videos.update(video_id,{
		approved: false
	}, function (data){
		res.send('ok')
	})
})

App.get ('/download-video/:videoId', function (req, res){
	var video_id = req.params.videoId
	ZiggeoSdk.Videos.download_video(video_id, function(data){
		var file_name = 'temp_video/'+video_id+'.mp4';
		Fs.writeFile(file_name, data, function(err){
            res.download(file_name)

        });
	});
})

App.get ('/download-image/:videoId', function (req, res){
	var video_id = req.params.videoId
	ZiggeoSdk.Videos.download_image(video_id, function(data){
		var file_name = 'temp_video/'+video_id+'.jpg';
		Fs.writeFile(file_name, data, function(err){
            res.download(file_name)

        });
	});
})

App.get ('/error/:errorId*?', function (req, res){
	var error_id = req.params.errorId
	var message = errorDecode(error_id)
	
	res.render ('error', {
		page_title: 'Error',
		message: message,
		need_ziggeo: 0
	})
})

App.get ('/success/:successId*?', function (req, res){
	var success_id = req.params.successId
	var message = successDecode(success_id)
	
	res.render ('success', {
		page_title: 'Success',
		message: message,
		need_ziggeo: 0
	})
})

function renderError(error_id){
	App.render ('error', {
		page_title: 'Error',
		message: errorDecode (error_id)
	})
}

function errorDecode (error_id){
	var message = ''
	switch (error_id) {
		case "1":
			message = 'Api key and token are required. Please add it to .env file in root directory.'
		break;
		case "2":
			message = 'There was some error with deleting'
		break;
		default:
			message = ''
		break;
	}
	return message
}

function successDecode (success_id){
	var message = ''
	switch (success_id) {
		case "1":
			message = ''
		break;
		case "2":
			message = 'Video was successfully deleted'
		break;
		default:
			message = ''
		break;
	}
	return message
}

App.use	('/static', Express.static ('public'))
var server = App.listen(3000, '127.0.0.1', function () {
	var host = server.address().address
	var port = server.address().port
  	console.log('Example app listening on http://%s:%s ', host, port)
})