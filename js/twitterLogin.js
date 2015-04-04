function getTweets(Y) {

	console.log('getTweets');

	// Specify the YQL query
	var query = "SELECT * FROM twitter.user.timeline WHERE screen_name='yuilibrary'";

	// Define the response handler that is executed when YQL responds with data
	var responseHandler = function(response) {
	var count, html = [], tweets, tweet;

	tweets = response.query.results.statuses.status;
	count = tweets.length;

	// Loop through each tweet
	for (var i = 0; i < count; i++) {

		// Snag the Tweet from the array
		tweet = tweets[i];

		// Some regex's to format the content in the tweet
		tweet.text = tweet.text.replace(/((ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?)/gi, '<a href="$1" target="_blank">$1<\/a>');
		tweet.text = tweet.text.replace(/@([a-zA-Z0-9_]+)/gi, '<a href="http://twitter.com/$1" target="_blank" class="username">@$1<\/a>');
		tweet.text = tweet.text.replace(/#([a-zA-Z0-9_]+)/gi, '<a href="http://search.twitter.com/search?q=%23$1" target="_blank" class="hashtag">#$1<\/a>');

		// Create the HTML for each tweet
		html.push("<div class='tweet'>");
		html.push(" <div>");
		html.push("  <a class='tweet-image' href=''><img src='" + tweet.user.profile_image_url + "' height='50' width='50'></a>");
		html.push(" </div>");
		html.push(" <div class='tweet-body'>");
		html.push("  <a href='http://twitter.com/" + tweet.user.screen_name + "' class='username' target='_blank'>" + tweet.user.screen_name + "</a>: " + tweet.text + "");
		html.push(" </div>");
		html.push(" <div style='clear:both'></div>");
		html.push("</div>");
	  
	};

	// Smoosh the HTML together
	html = html.join('');

	// Insert it into the #tweets node
	Y.one("#tweets").set("innerHTML", html);
}

YUI({
    combine: false,
    filter: "raw",
    debug: false,
    modules: {
        'Twitter': {
           fullpath: 'js/twitter.js'
        },
        'myYQL': {
            fullpath: 'js/yql.js',
            requires: ['jsonp', 'jsonp-url']
        }
    }
}).use('Twitter', 'gallery-storage-lite', 'myYQL', 'node', "event", function (Y) {

    "use strict";

    var twtBtn = Y.one('#twitterlogin');

    twtBtn.on('click', function (e) {
        Y.Twitter.call({ type: "request_token" }, function (tokens) {
            Y.log("step 1");
            Y.log(tokens);
            Y.StorageLite.setItem('oauth_token', tokens.oauth_token);
            Y.StorageLite.setItem('oauth_token_secret', tokens.oauth_token_secret);
            window.setTimeout(function () {
                window.location = "https://twitter.com/oauth/authenticate?oauth_token=" + tokens.oauth_token + "&oauth_token_secret=" + tokens.oauth_token_secret;
            }, 10);
        });
    });

    if (getQueryStringParameter('oauth_token')) {

        

        Y.StorageLite.setItem('oauth_token', getQueryStringParameter('oauth_token'));
        Y.StorageLite.setItem('oauth_verifier', getQueryStringParameter('oauth_verifier'));

        Y.Twitter.config({
            oauth_token: getQueryStringParameter('oauth_token'),
            oauth_token_secret: getQueryStringParameter('oauth_token_secret')
        });

        Y.Twitter.call({ type: "access_token" }, function (tokens) {
           // Y.StorageLite.setItem('oauth_token', tokens.oauth_token);
           // Y.StorageLite.setItem('oauth_token_secret', tokens.oauth_token_secret);
           
            Y.Twitter.config({
                oauth_token: tokens.oauth_token,
                oauth_token_secret: tokens.oauth_token_secret
            });

            Y.Twitter.call({ type: "credentials" }, function (user) {
                Y.Twitter.config({
                    screen_name: user.screen_name,
                    user_id: user.id
                });
               
            });
        });
    }

	//Do Stuff
	console.log('getTweets');
	getTweets(Y);
   
});

function getHashStringParameter(parameter) {
    var i, parameters, pos, paramname, paramval, queryString;

    queryString = {};
    parameters = window.location.hash.substring(1).split('&');

    for (i in parameters) {
        if (parameters.hasOwnProperty(i)) {
            pos = parameters[i].indexOf('=');
            if (pos > 0) {
                paramname = parameters[i].substring(0, pos);
                paramval = parameters[i].substring(pos + 1);
                queryString[paramname] = unescape(paramval.replace(/\+/g, ' '));
            }
            else {
                queryString[parameters[i]] = "";
            }
        }
    }

    if (queryString[parameter]) {
        return queryString[parameter];
    }
    else {
        return false;
    }
}

function getQueryStringParameter(key, queryString) {
    //TODO: Cleanup
    var queryString = queryString || window.location.href;
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
    var qs = regex.exec(queryString);
    if (qs)
        return qs[1];
    else
        return false;
}