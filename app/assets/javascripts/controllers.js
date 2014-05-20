'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
  .controller('HomeCtrl', ['$rootScope', '$scope', 'syncData', 'loginService', '$modal', '$log', function($rootScope, $scope, syncData, loginService, $modal, $log) {
      // syncData('syncedValue').$bind($scope, 'syncedValue');
    $scope.orders = {};
    $scope.status = {
      isFirstOpen: true,
      isFirstDisabled: false
    };
    $scope.ordersToArray = function() {
      var result = [];
      angular.forEach($scope.orders, function(order, id) {
        order["hash"] = id;
        result.push(order);
      });
      return result;
    };
    $scope.options = {
      store: ['五十嵐', 'ComeBuy', 'Happy Lemon']
    };

    $rootScope.$on("$firebaseSimpleLogin:login", function(e, user){
      syncData(['user', $scope.auth.user.id])
        .$on('child_removed', function(obj) {
          // console.log(obj);
          delete $scope.orders[obj.snapshot.name];
        });
      //   .$bind($scope, 'ordersIds').then(function(){
      // });
      syncData(['user', $scope.auth.user.id])
        .$on('value', function(obj) {
          var orderNames = obj.snapshot.value;
          // orders[orderName] = '';
          if (orderNames != null) {
            Object.keys(orderNames).forEach(function (orderName) { 
              var value = orderNames[orderName]
              syncData(['order', orderName]).$on('value', function(obj) {
                $scope.orders[orderName.toString()] = obj.snapshot.value;//JSON.stringify(obj.snapshot.value);
                // console.log($scope.orders[orderName]);
              });
            });
          }
        });

    });

    $scope.popOrderModal = function (size) {
      var modalInstance = $modal.open({
        templateUrl: 'orderModalContent.html',
        controller: 'OrderModalCtrl',
        size: size,
        resolve: {
          options: function () {
            return $scope.options;
          }
        }
      });

      modalInstance.result.then(function (selected) {
        // $scope.selected = selectedItem;
        $scope.addOrder(selected);
      }, function () {
        // $log.info('Modal dismissed at: ' + new Date());
      });
    };

    $scope.addOrder = function(selected) {
      var time = new Date();
      var hash = CryptoJS.SHA256(Math.random() + CryptoJS.SHA256(selected.store) + time.valueOf());
    
      syncData(['order', hash.toString()])
        .$set({
          // Orderer Name, ID, etc.
          store: selected.store,
          timelimit: selected.timelimit.getHours()+selected.timelimit.getMinutes()/60,
          timestamp: time.valueOf(),
          items: {
            "0": {name:"檸檬綠", sugar:"10",ice:"5", price:"30", quantity:"3"},
            "1": {name:"珍珠奶茶", sugar:"5",ice:"7", price:"35", quantity:"2"}
          }
        })
        .then(function(ref){
          syncData(['user', $scope.auth.user.id, hash.toString()])
            .$set({
              timestamp: time.valueOf()
            });
          // syncData(['user', $scope.auth.user.id, hash.toString()]).$priority = time.valueOf();
        });
      // syncData(['order', hash.toString()]).$priority = time.valueOf();
    };

    $scope.getDateTime = function(timestamp, limit) {
      var date = new Date(timestamp + 3600000 * limit);
      return date.toLocaleDateString() + ": " + date.toLocaleTimeString();
    };

    $scope.isActiveCSS = function(timestamp, limit) {
      var currentTime = new Date();
      if (currentTime.valueOf() < (timestamp + 3600000 * limit)) {
        return ['panel', 'panel-warning'];
      }
      else {
        return ['panel', 'panel-danger'];
      }
    };

    $scope.isActive = function(timestamp, limit) {
      var currentTime = new Date();
      if (currentTime.valueOf() < (timestamp + 3600000 * limit)) {
        return true;
      }
      else {
        return false;
      }
    };

    $scope.login = function(cb) {
      $scope.err = null;
      $scope.user = "";
      loginService.login(function(err, user) {
        if( !err ) {
          cb && cb(user);
        }
      });
    };

    $scope.logout = function() {
      loginService.logout();
    };
   }])

  .controller('OrderModalCtrl', ['$scope', '$modalInstance', 'options', function($scope, $modalInstance, options) {
    var d = new Date();
    d.setHours(2);
    d.setMinutes(0);

    $scope.options = options;
    $scope.timelimit = d;

    $scope.selected = {
      store: $scope.options.store[0],
      timelimit: $scope.timelimit
    };

    $scope.ok = function () {
      $modalInstance.close($scope.selected);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }])
 
  .controller('OrderCtrl', ['$scope', '$routeParams', '$location', 'syncData', function($scope, $routeParams, $location, syncData) {
      $scope.orderId = $routeParams.hashId;
      $scope.order = null;
      $scope.status = {
        isFirstOpen: false
      };

      syncData(['order', $scope.orderId])
        .$on('value', function(obj) {
          $scope.order = obj.snapshot.value;
          $scope.order['hash'] = $scope.orderId;//JSON.stringify(obj.snapshot.value);
          $scope.status.isFirstOpen = !$scope.status.isFirstOpen;
        });

      $scope.isActiveCSS = function(timestamp, limit) {
        var currentTime = new Date();
        if (currentTime.valueOf() < (timestamp + 3600000 * limit)) {
          return ['panel', 'panel-warning'];
        }
        else {
          return ['panel', 'panel-danger'];
        }
      };
      
      $scope.getDateTime = function(timestamp, limit) {
        var date = new Date(timestamp + 3600000 * limit);
        return date.toLocaleDateString() + ": " + date.toLocaleTimeString();
      };

      // $scope.viewOrder = function(hashId) {
      //   $location.url('/order' + hashId);
      // }

   }])

  .controller('ChatCtrl', ['$scope', 'syncData', function($scope, syncData) {
      $scope.newMessage = null;

      // constrain number of messages by limit into syncData
      // add the array into $scope.messages
      $scope.messages = syncData('messages', 10);

      // add new messages to the list
      $scope.addMessage = function() {
         if( $scope.newMessage ) {
            $scope.messages.$add({text: $scope.newMessage});
            $scope.newMessage = null;
         }
      };
   }])

   .controller('LoginCtrl', ['$scope', 'loginService', '$location', function($scope, loginService, $location) {
      $scope.email = null;
      $scope.pass = null;
      $scope.confirm = null;
      $scope.createMode = false;

      $scope.login = function(cb) {
        $scope.err = null;
        loginService.login(function(err, user) {
          $scope.err = err? err + '' : null;
          if( !err ) {
            cb && cb(user);
          }
        });
      };
      //
      // $scope.createAccount = function() {
      //    $scope.err = null;
      //    if( assertValidLoginAttempt() ) {
      //       loginService.createAccount($scope.email, $scope.pass, function(err, user) {
      //          if( err ) {
      //             $scope.err = err? err + '' : null;
      //          }
      //          else {
      //             // must be logged in before I can write to my profile
      //             $scope.login(function() {
      //                loginService.createProfile(user.uid, user.email);
      //                $location.path('/account');
      //             });
      //          }
      //       });
      //    }
      // };
      //
      // function assertValidLoginAttempt() {
      //    if( !$scope.email ) {
      //       $scope.err = 'Please enter an email address';
      //    }
      //    else if( !$scope.pass ) {
      //       $scope.err = 'Please enter a password';
      //    }
      //    else if( $scope.pass !== $scope.confirm ) {
      //       $scope.err = 'Passwords do not match';
      //    }
      //    return !$scope.err;
      // }
   }])

   .controller('AccountCtrl', ['$scope', 'loginService', /*'changeEmailService',*/ 'firebaseRef', 'syncData', '$location', 'FBURL', function($scope, loginService, /*changeEmailService,*/ firebaseRef, syncData, $location, FBURL) {
      $scope.syncAccount = function() {
         $scope.user = {};
         syncData(['users', $scope.auth.user.uid]).$bind($scope, 'user').then(function(unBind) {
            $scope.unBindAccount = unBind;
         });
      };
      // set initial binding
      $scope.syncAccount();

      $scope.logout = function() {
         loginService.logout();
      };

      $scope.oldpass = null;
      $scope.newpass = null;
      $scope.confirm = null;

      $scope.reset = function() {
         $scope.err = null;
         $scope.msg = null;
         $scope.emailerr = null;
         $scope.emailmsg = null;
      };

      $scope.updatePassword = function() {
         $scope.reset();
         loginService.changePassword(buildPwdParms());
      };

      $scope.updateEmail = function() {
        $scope.reset();
        // disable bind to prevent junk data being left in firebase
        $scope.unBindAccount();
        // changeEmailService(buildEmailParms());
      };

      function buildPwdParms() {
         return {
            email: $scope.auth.user.email,
            oldpass: $scope.oldpass,
            newpass: $scope.newpass,
            confirm: $scope.confirm,
            callback: function(err) {
               if( err ) {
                  $scope.err = err;
               }
               else {
                  $scope.oldpass = null;
                  $scope.newpass = null;
                  $scope.confirm = null;
                  $scope.msg = 'Password updated!';
               }
            }
         };
      }
      function buildEmailParms() {
         return {
            newEmail: $scope.newemail,
            pass: $scope.pass,
            callback: function(err) {
               if( err ) {
                  $scope.emailerr = err;
                  // reinstate binding
                  $scope.syncAccount();
               }
               else {
                  // reinstate binding
                  $scope.syncAccount();
                  $scope.newemail = null;
                  $scope.pass = null;
                  $scope.emailmsg = 'Email updated!';
               }
            }
         };
      }

   }]);
