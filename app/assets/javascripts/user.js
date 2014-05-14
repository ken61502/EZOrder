# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/
var spinner = new Spinner({color: '#ddd'});
var firebaseRef = 'https://ezorder.firebaseio.com/';
var firebaseUser = new Firebase(firebaseRef + "user/");
var firebaseOrder = new Firebase(firebaseRef + "order/")
var userName = "";
var auth;

function handleFileSelect(evt) {
  var f = evt.target.files[0];
  var reader = new FileReader();
  reader.onload = (function(theFile) {
    return function(e) {
      var filePayload = e.target.result;
      // Generate a location that can't be guessed using the file's contents and a random number
      var hash = CryptoJS.SHA256(Math.random() + CryptoJS.SHA256(filePayload));
      var f = new Firebase(firebaseRef + 'user/' + hash + '/filePayload');
      spinner.spin(document.getElementById('spin'));
      // Set the file payload to Firebase and register an onComplete handler to stop the spinner and show the preview
      f.set(filePayload, function() {
        spinner.stop();
        document.getElementById("pano").src = e.target.result;
        $('#file-upload').hide();
        // Update the location bar so the URL can be shared with others
        window.location.hash = hash;
      });
    };
  })(f);
  reader.readAsDataURL(f);
}

function login() {
  // attempt to log the user in with your preferred authentication provider
  auth.login('facebook');
}

function logout() {
  auth.logout();
}

$(function() {
  $("#logout").click(function(e) {
    $("#logout").hide();
    logout();
  });
  $("#login").click(function(e) {
    $("#login").hide();
    login();
  });

  $("#login").hide();
  $("#logout").hide();
  $("#send").click(function(e){
    var data = $("#text").val();
    var time = new Date();
    var hash = CryptoJS.SHA256(Math.random() + CryptoJS.SHA256(data) + time.valueOf());
    var prior = time.valueOf();
    firebaseUser.child(hash.toString()).setWithPriority(prior.toString(), prior);
    // firebaseUser.child(hash.toString()).setWithPriority({
    //   store: data,
    //   start_time: time.toLocaleDateString()+": "+time.toLocaleTimeString(),
    //   timestamp: time.valueOf(),
    //   items: {
    //     "0": {name:"lemon tea", sugar:"10",ice:"5", price:"30", quantity:"3"},
    //     "1": {name:"bubble tea", sugar:"5",ice:"7", price:"35", quantity:"2"}
    //   }
    // }, prior);
    firebaseOrder.child(hash.toString()).set({
      store: data,
      start_time: time.toLocaleDateString()+": "+time.toLocaleTimeString(),
      timestamp: time.valueOf(),
      items: {
        "0": {name:"lemon tea", sugar:"10",ice:"5", price:"30", quantity:"3"},
        "1": {name:"bubble tea", sugar:"5",ice:"7", price:"35", quantity:"2"}
      }
    });
    console.log(prior);
  });

  auth = new FirebaseSimpleLogin(firebaseUser, function(error, user) {
    if (error) {
      // an error occurred while attempting login
      console.log(error);
    }
    else if (user) {
      // user authenticated with Firebase
      $("#logout").show();
      userName = user.displayName;
      firebaseUser = firebaseUser.child(user.id);

      firebaseUser.on('child_added', function(snapshot) {
        var order = snapshot.val();
        var url = snapshot.ec.path.m[2];

        firebaseOrder.child(url).once('value', function(snapshot) {
          var order = snapshot.val();
          var url = snapshot.ec.path.m[1];
          console.log(order);
          console.log(url);

          displayOrder(url, order);
        });
      });

      console.log(firebaseRef + "user/" + user.id);
      console.log(userName);
    }
    else {
      $("#login").show();
      console.log("Logged Out");
      // user is logged out
    }
  });
});

function displayOrder(url, order) {
  $("#order-container").prepend("<div class=\"panel panel-warning\">"
    + "<div class=\"panel-heading\"><ul class='nav nav-pills'><li><a href='#'>"+order.store+"</a></li><li class=\"\"><a href=\"#\">Share Link</a></li></div>"
    +   "<div class=\"panel-body\"><p>"+order.start_time+" 開單</p></div>"
    +   "<table class=\"table\"><thead><tr><td>品項</td><td>甜度</td><td>冰塊</td><td>單價</td><td>數量</td></tr></thead>"
    +   "<tbody id=\"order-"+ order.timestamp +"\"></tbody>"
    +   "</table>"
    + "</div>");
  for (var i = 0; i < order.items.length; i++) {
    $("#order-"+order.timestamp).append("<tr><td>"+order.items[i].name
      +"</td><td><div class=\"btn-group-xs\">"
      +   "<button type=\"button\" data-sugar-"+i+"='10' class=\"btn btn-default\">全糖</button>"
      +   "<button type=\"button\" data-sugar-"+i+"='7' class=\"btn btn-default\">少糖</button>"
      +   "<button type=\"button\" data-sugar-"+i+"='5' class=\"btn btn-default\">半糖</button>"
      +   "<button type=\"button\" data-sugar-"+i+"='3' class=\"btn btn-default\">微糖</button>"
      +   "<button type=\"button\" data-sugar-"+i+"='0' class=\"btn btn-default\">無糖</button>"
      + "</div> "
      +"</td><td><div class=\"btn-group-xs\">"
      +   "<button type=\"button\" data-ice-"+i+"='10' class=\"btn btn-default\">全冰</button>"
      +   "<button type=\"button\" data-ice-"+i+"='7' class=\"btn btn-default\">少冰</button>"
      +   "<button type=\"button\" data-ice-"+i+"='5' class=\"btn btn-default\">半冰</button>"
      +   "<button type=\"button\" data-ice-"+i+"='3' class=\"btn btn-default\">微冰</button>"
      +   "<button type=\"button\" data-ice-"+i+"='0' class=\"btn btn-default\">無冰</button>"
      + "</div> "
      +"</td><td>"+order.items[i].price
      +"</td><td>"+order.items[i].quantity
      +"</td></tr>");
    $("#order-"+order.timestamp+" button[data-sugar-"+i+"="+order.items[i].sugar+"]").addClass('active');
    $("#order-"+order.timestamp+" button[data-ice-"+i+"="+order.items[i].ice+"]").addClass('active');
  }
}

// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
// (function(){
//   var cache = {};

//   this.tmpl = function tmpl(str, data){
//     // Figure out if we're getting a template, or if we need to
//     // load the template - and be sure to cache the result.
//     var fn = !/\W/.test(str) ?
//       cache[str] = cache[str] ||
//         tmpl(document.getElementById(str).innerHTML) :

//       // Generate a reusable function that will serve as a template
//       // generator (and which will be cached).
//       new Function("obj",
//         "var p=[],print=function(){p.push.apply(p,arguments);};" +

//         // Introduce the data as local variables using with(){}
//         "with(obj){p.push('" +

//         // Convert the template into pure JavaScript
//         str
//           .replace(/[\r\t\n]/g, " ")
//           .split("<%").join("\t")
//           .replace(/((^|%>)[^\t]*)'/g, "$1\r")
//           .replace(/\t=(.*?)%>/g, "',$1,'")
//           .split("\t").join("');")
//           .split("%>").join("p.push('")
//           .split("\r").join("\\'")
//       + "');}return p.join('');");

//     // Provide some basic currying to the user
//     return data ? fn( data ) : fn;
//   };
// })();

// $(function() {
//   $('#spin').append(spinner);
//   var idx = window.location.href.indexOf('#');
//   var hash = (idx > 0) ? window.location.href.slice(idx + 1) : '';
//   if (hash === '') {
//     // No hash found, so render the file upload button.
//     $('#file-upload').show();
//     document.getElementById("file-upload").addEventListener('change', handleFileSelect, false);
//   } else {
//     // A hash was passed in, so let's retrieve and render it.
//     spinner.spin(document.getElementById('spin'));
//     var f = new Firebase(firebaseRef + '/pano/' + hash + '/filePayload');
//     f.once('value', function(snap) {
//       var payload = snap.val();
//       if (payload != null) {
//         document.getElementById("pano").src = payload;
//       } else {
//         $('#body').append("Not found");
//       }
//       spinner.stop();
//     });
//   }
// });
