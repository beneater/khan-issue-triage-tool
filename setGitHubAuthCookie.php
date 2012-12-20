
<?php
/*
 * test_oauth_client.php
 *
 * @(#) $Id: test_oauth_client.php,v 1.4 2012/10/05 09:22:40 mlemos Exp $
 * See:  http://freecode.com/projects/php-oauth-api
 * 	 and http://www.phpclasses.org/package/3-PHP-HTTP-client-to-access-Web-site-pages.html
 *
 */

    require('http.php');
    require('oauth_client.php');
    
    /* Create the OAuth authentication client class */ 
    $client = new oauth_client_class;

    /*
     * Set to true if you want to make the class dump
     * debug information to PHP error log
     */
    $client->debug = false;

    /*
     * Set to true if you want to make the class also dump
     * debug output of the HTTP requests it sends.
     */
    $client->debug_http = false;


    /* OAuth server type name
     * Setting this variable to one of the built-in supported OAuth servers
     * will make the class automatically set all parameters specific of that
     * type of server.
     * 
     * Currently, built-in supported types are: Facebook, github, Google,
     * Microsoft, Foursquare, Twitter and Yahoo.
     * 
     * Send e-mail to mlemos at acm.org if you would like the class to have
     * built-in support to access other OAuth servers.
     * 
     * Set to an empty string to use another type of OAuth server. Check the
     * documentation to learn how to set other parameters to configure the
     * class to access that server
     */
    $client->server = 'github';

    /* OAuth authentication URL identifier
     * This should be the current page URL without any request parameters
     * used by OAuth, like state and code, error, denied, etc..
     */
    $client->redirect_uri = 'http://'.$_SERVER['HTTP_HOST'].
        dirname(strtok($_SERVER['REQUEST_URI'],'?')).'/setGitHubAuthCookie.php';

    /* OAuth client identifier
     * Set this to values defined by the OAuth server for your application
     */
    $client->client_id = '6a6b503d02c2f50eb9db';

    /* OAuth client secret
     * Set this to values defined by the OAuth server for your application
     */
    $client->client_secret = 'daad51608b271c0902cd73acb85e17fad7cbd0c9';

    /* OAuth client permissions
     * Set this to the name of the permissions you need to access the
     * application API
     */
    $client->scope = 'user,repo';
    
    /* Process the OAuth server interactions */
    if(($success = $client->Initialize()))
    {
        /*
         * Call the Process function to make the class dialog with the OAuth
         * server. If you previously have retrieved the access token and set
         * the respective class variables manually, you may skip this call and
         * use the CallAPI function directly.
         */
        $success = $client->Process();
        // Make sure the access token was successfully obtained before making
        // API calls
        if(strlen($client->access_token))
        {
		// Note: this transmits the accessToken on HTTP, which could be sniffed
		// TODO: Add HTTPS to the server and use setcookie($secure=true)
		// Expires in 7 days
		setcookie( "GitHubAccessToken", $client->access_token, time() + 60 * 60 * 60 * 24 * 7 );
		// Redirect to index.html
		header( 'Location: http://'.$_SERVER['HTTP_HOST'].
        		dirname(strtok($_SERVER['REQUEST_URI'],'?')).'/index.html' );
        }
	else
	{
		// Display error message ?
	}
        
        /* Internal cleanup call
         */
        $success = $client->Finalize($success);
    }
    /*
     * If the exit variable is true, the script must not output anything
     * else and exit immediately
     */
    if($client->exit)
        exit;
    
    if($success)
    {
        /*
         * The Output function call is here just for debugging purposes
         * It is not necessary to call it in real applications
         */
        $client->Output();
    }
    else
    {
        /* 
         * If there was an unexpected error, display to the user
         * some useful information
         */
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<title>OAuth client error</title>
</head>
<body>
<h1>OAuth client error</h1>
<pre>Error: <?php echo HtmlSpecialChars($client->error); ?></pre>
<a href="index.html?noauth=true">Click here to open issue triage with noauth</a>
</body>
</html>
<?php
    }

?>
