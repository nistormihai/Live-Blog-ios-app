$(function() {

  window.gap =  {



   initialize: function(callback) {
    console.log("gap initialize inside");
    var self = this;
    var _callback = callback;

    this.db = window.openDatabase("mobileLiveBlog", "1.0", "mobile Live Blog", 1 * 1024 * 1024);


    this.createTables(_callback);




  },

  createTables: function(callback) {
    var _callback = callback;

    this.db.transaction(
     function(tx) {

       tx.executeSql('CREATE TABLE IF NOT EXISTS user(login VARCHAR(250), pass VARCHAR(500), host VARCHAR(1000))');

       _callback();

     },

     this.txErrorHandler
     );
  },


  getUser: function(callback) {


    var user = {};
    this.db.transaction(
     function(tx) {
       var sql = 'SELECT * FROM user LIMIT 1';


       tx.executeSql(sql, [], function (tx,results) {

        results.rows.length > 0 ? user = results.rows.item(0) : user = {};

        callback(user);

      },
      function(err) {
        console.log("getUser error"+err.code);
        user = {};
        callback(user);
      }
      );
     }, this.txErrorHandler
     );

  },

  addUser: function(login, pass, host) {
   this.db.transaction(
     function(tx) {
       var sql = "DELETE FROM user";


       tx.executeSql(sql);

     },
     this.txErrorHandler
     );

   this.db.transaction(
     function(tx) {
      var hash = new jsSHA(pass, "ASCII");
      var hashedPass = hash.getHash("SHA-512", "HEX");

      var sql = 'INSERT INTO user(login, pass, host) VALUES("'+login+'", "'+hashedPass+'", "'+host+'")';

      tx.executeSql(sql);
    },
    this.txErrorHandler
    );

 },




 deleteUser: function(callback) {


   this.db.transaction(
     function(tx) {
       var sql = 'DELETE FROM user';

       tx.executeSql(sql,
         this.txErrorHandler,

         function(tx, results) {
           callback();
         });
     },
     this.txErrorHandler
     );

 },




 txErrorHandler: function(err) {
  console.log(err.code+'  '+err.message);
  app.alert("There was an error. Please try again");
}
};



window.auth = {
 route: "login",

 login: function(callback){

      //route reset
      auth.route = "login";

      this.loginCallback = callback;

      gap.getUser(function(user){



        if(_.isEmpty(user)){

          auth.loginCallback();
          return;
        }



        var req = { userName: user.login  };

        try{
          $.ajax({
            url: 'http://'+user.host+'/resources/Security/Authentication.json',
            type: 'POST',
            data: req,
            dataType: "json",
            crossDomain: true,
            cache:false,
            success: function(data) {

              console.log(JSON.stringify(data));
              app.session.set("token", data.Token);
              app.session.set("host", user.host);
              auth.authorize(user, function(){


                    // if there is id of blog assigned - go to entriesList. Otherwise let the user select a Blog
                    if(!app.session.get("blog")){
                      auth.route = "blogsList";
                    }else{
                      auth.route = "entriesList";
                    }

                    if(!app.session.get("userId")) auth.route = "login";
                    auth.loginCallback();
                });



            },
            error: function(jqXHR, textStatus, errorThrown) {
              console.log("login fail");



              auth.loginCallback();

            }
          });
        }
        catch(err){

          console.log(err);
          auth.loginCallback();
        }


      });


},

authorize: function(user, callback){

  var token = app.session.get("token");

  shaPassword = user.pass;
  shaStep1 = new jsSHA(shaPassword, "ASCII");
  shaStep2 = new jsSHA(token, "ASCII");
  hash = shaStep1.getHMAC(user.login, "ASCII", "SHA-512", "HEX");
  hash = shaStep2.getHMAC(hash, "ASCII", "SHA-512", "HEX");

  var req = { Token: token, HashedToken: hash , UserName: user.login };


  this.authorizeCallback = callback;




  try{
    $.ajax({
      url: 'http://'+user.host+'/resources/Security/Authentication/Login.json',
      type: 'POST',
      data: req,
      crossDomain: true,
      cache:false,
      dataType: 'json',
      success: function(data) {
        console.log("auth success");
        app.session.set("userId", data.User.Id);
        app.session.set("session", data.Session);
        auth.authorizeCallback();

      },
      error: function(jqXHR, textStatus, errorThrown, callback) {



       console.log("auth fail: "+jqXHR.responseText);
       auth.authorizeCallback();

     }
   });
  }
  catch(err){
    console.log(err);
    auth.authorizeCallback();
  }



},

logout : function(){
  gap.deleteUser(function(){
    app.session.clear();
    app.snapper.close();
    app.router.navigate("someDeadRoute");
    app.router.navigate("login", {trigger: true});
  });
}

};


window.app = {

  router : new window.Router,
  session : new window.SessionModel,
  blogsCollection : new window.blogsCollection,
  loginView : new window.LoginView,



  alert : function (text) {
    $("#alert p").html(text);
    $("#alert").css("display", "table");

    setTimeout(function(){
      $("#alert").fadeOut();
    },2000);

  },


  init : function(){
    console.log("app init");


    new FastClick(document.body);




    app.snapper = new Snap({
      element: document.getElementById('content'),
      disable: 'right'
    });


    $(".toggle-left").bind('click', function(){

      app.snapper.state().state=="left" ? app.snapper.close() : app.snapper.open('left');
    });

    $("#logout_button").bind("click", auth.logout);

    gap.initialize(function() {

      auth.login(function(){

        console.log("auth.route: "+auth.route);
        Backbone.history.start();
        app.router.navigate("someDeadRoute");

        app.router.navigate(auth.route, {trigger: true});


      });
    });

  }

}




app.init();
//document.addEventListener("deviceready", app.init, false);

});

