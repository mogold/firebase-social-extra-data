(function() {
	'use strict';
	angular
		.module('firebase')
		.factory('loginFactory', loginFactory)
		function loginFactory($http){
		
			function googleLogin(){
				// firebase login provider
				var provider = new firebase.auth.GoogleAuthProvider();

				// provider scopes
				provider.addScope('https://www.googleapis.com/auth/plus.login');
				provider.addScope('https://www.googleapis.com/auth/userinfo.email');
				
				// logging in then creating new user
				firebase.auth().signInWithPopup(provider).then(function(result) {
					setNewUser(result, 'google');
				}).catch(function(e){
					console.log(e);
				});
			};

			function facebookLogin(){
				// firebase login provider
				var provider = new firebase.auth.FacebookAuthProvider();

				// provider scopes
				provider.addScope('email');

				// logging in then creating new user
				firebase.auth().signInWithPopup(provider).then(function(result) {
					setNewUser(result, 'facebook');
				}).catch(function(e){
					console.log(e);
				});
			};
			
			function setNewUser(user, provider){

				// setting base variables
				var currentUser = user.user.uid;
				var providerScopeData = Array();
				var usersArray = Array();
				var usersRef = firebase.database().ref().child('users');
				
				// getting users from user node in firebase database
				// NOTE: this is a database node created by us not the firebase auth users
				usersRef.once('value').then(function(users){
					users.forEach(function(user){
						var userKey = user.key;usersArray.push(userKey);
					});

					// checking if current user is already saved
					if(usersArray.includes(currentUser)){
						// user exists
					} else {
						// save user data to users node 
						if(provider === 'google'){
							// putting headers into its own variable
							var Authorization = 'Bearer ' + user.credential.accessToken;
							
							// http request to google for user data
							$http({
								method: 'GET', 
								url: 'https://www.googleapis.com/userinfo/v2/me', 
								headers : {Authorization}
							}).then(function(s){
								// putting the data into an array for firebase to be able to read it
								providerScopeData.push(s.data);
								// adding the user to users node 
								var userNode = firebase.database().ref().child('users/' + currentUser);
								// updating with the users data
								userNode.update(providerScopeData[0]);
							}).catch(function(e){
								console.log(e)
							});
						} else if(provider === 'facebook'){
							// getting access token from firebase user object returned when user logs in
							var access_token = user.credential.accessToken;
							// building url to facebook graph api with requested fields and access_token
							var graphURL = 'https://graph.facebook.com/me/?fields=age_range,gender,location,email,name,link&access_token=' + access_token;
							$http({
								method: 'GET', 
								url: graphURL
							}).then(function(s){
								// putting the data into an array for firebase to be able to read it
								providerScopeData.push(s.data); 
								// adding the user to users node 
								var userNode = firebase.database().ref().child('users/' + currentUser); 
								// updating with the users data
								userNode.update(providerScopeData[0]);
							}).catch(function(e){
								console.log(e)
							});
						}
					}
				}).catch(function(e){
					console.log(e);
				});
			}
			
			return service;
		}
})();
