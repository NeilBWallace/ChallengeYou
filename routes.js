var User = require('./user.js');

module.exports = function(App){

    App.get('/:username/:password', function(req,res){
        var newUser = new User();
        newUser.local.username= req.params.username;
        newUser.local.password = req.params.password;
        console.log(newUser.local.username );
        newUser.save(function(err){
            if(err){throw err;}
        });
   
   
   
   
        res.render('home', {
            page_title: 'Challenge You',
            need_ziggeo: 0
        });
    });



    App.get('/', function(req,res){
    	res.render('home', {
            page_title: 'Challenge You',
            need_ziggeo: 0
        })   });
};