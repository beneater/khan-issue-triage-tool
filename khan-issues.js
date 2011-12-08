// Array Remove & Pretty Date - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

// Takes an ISO time and returns a string representing how
// long ago the date represents.
//
// hack added: it assumes time is UTC
function prettyDate(time) {
	var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
		diff = (((new Date()).getTime() - date.getTime() + date.getTimezoneOffset() * 60000) / 1000),
		day_diff = Math.floor(diff / 86400);

	if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
		return;

	return day_diff == 0 && (
			diff < 60 && "just now" ||
			diff < 120 && "1 minute ago" ||
			diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
			diff < 7200 && "1 hour ago" ||
			diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
		day_diff == 1 && "Yesterday" ||
		day_diff < 7 && day_diff + " days ago" ||
		day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
}


// tags listed first get matched first
// "other" is special and should be last
// to add a tag, also update the HTML and populateDom calls below
var TAGS = [ "realbug", "notabug", "other" ];

jQuery( function() {
	jQuery( "#tabs" ).tabs();
	jQuery( "#loading" ).fadeIn( 200 );
	var newIssues = {};
	var taggedIssues = {};
	jQuery.each( TAGS, function() {
		taggedIssues[ this ] = {};
	});
	var converter = new Showdown.converter();
	var progress = 0;

	var getIssues = function( page ) {
		var commentXHRs = [];
		jQuery.getJSON( 'https://api.github.com/repos/Khan/khan-exercises/issues?page=' + page + '&per_page=100&callback=?', function( data ) {
			jQuery( "#githublimit" ).text( data.meta[ "X-RateLimit-Remaining" ] );
			jQuery.each( data.data, function() {
				if ( this.user.login == "KhanBugz" ) {
					var exercise = this;
					var exerciseName = this.title.split(" - ")[0];
					if (exerciseName === "") {
						exerciseName = "Unknown exercise";
					}
					if ( this.comments > 0 ) {
						commentXHRs.push( jQuery.getJSON( 'https://api.github.com/repos/Khan/khan-exercises/issues/' + this.number + '/comments?per_page=100&callback=?', function( data ) {
							++progress;
							jQuery( "#loadprogress" ).text( "(" + progress + ")" );
							jQuery( "#githublimit" ).text( data.meta[ "X-RateLimit-Remaining" ] );
							var text = "";
							jQuery.each( data.data, function() {
								text += this.body;
							});
							jQuery.each( TAGS, function() {
								if ( ( text.toLowerCase().search( this ) !== -1 ) || ( String(this) === "other" ) ) {
									if ( exerciseName in taggedIssues[ this ] ) {
										taggedIssues[ this ][ exerciseName ].push( exercise );
									} else {
										taggedIssues[ this ][ exerciseName ] = [ exercise ];
									}
									return false;
								}
							});
						}));
					} else {
						if ( exerciseName in newIssues ) {
							newIssues[ exerciseName ].push( this );
						} else {
							newIssues[ exerciseName ] = [ this ];
						}
					}
				}
			});
			jQuery.when.apply( jQuery, commentXHRs ).done(function() {
				progress = page * 100;
				jQuery( "#loadprogress" ).text( "(" + progress + ")" );
				if ( data.meta.Link[0][1].rel === "next" ) {
					getIssues( page + 1 );
				} else {
					var populateDom = function( issueList, container ) {
						var sortedIssues = [];
						var totalIssues = 0;
						jQuery.each( issueList, function( exerciseName, value ) {
							sortedIssues.push( exerciseName );
							totalIssues += value.length;
						});
						sortedIssues = sortedIssues.sort( function(a, b) { return issueList[ b ].length - issueList[ a ].length; });

						jQuery.each( sortedIssues, function() {
							var exerciseName = this + "";
							var joinedTitle = exerciseName.split(' ').join('');
							var issue = jQuery( "#" + container + " .exercise-list" ).append( '<div id="' + joinedTitle + '" class="exercise-list-item">' )
							jQuery( "#" + container + " #" + joinedTitle ).append('<span class="issue-count">');
							jQuery( "#" + container + " #" + joinedTitle ).append('<span class="exercise-name">');
							jQuery( "#" + container + " #" + joinedTitle + " .issue-count" ).append( issueList[ exerciseName ].length ) ;
							jQuery( "#" + container + " #" + joinedTitle + " .exercise-name" ).append( exerciseName ) ;
							jQuery( "#" + container + " #" + joinedTitle ).click( function( event ) {
								event.preventDefault();
								jQuery( "#" + container + " .exercise-list .exercise-list-item" ).removeClass( "highlighted" );
								jQuery( this ).addClass( "highlighted" );
								var detail = jQuery( "#" + container + " .issue-detail" )
								detail.empty();
								detail.scrollTop( 0 );
								jQuery( "<h2>" ).append( exerciseName ).appendTo( detail );
								jQuery.each( issueList[ exerciseName ], function() {
									var issuediv = jQuery( "<div>" ).addClass("issue").appendTo( detail );
									var issuelink = jQuery( "<a>" ).append( "#" + this.number + "&nbsp;&mdash;&nbsp;" + this.title.split(" - ")[1] ).appendTo( jQuery( issuediv ) );
									issuelink.attr({
										href: this.html_url,
										target: "github"
									});
									jQuery( issuediv ).append( "<br />" + ( prettyDate( this.created_at ) || this.created_at ) );
									var markdown = converter.makeHtml( this.body );
									markdown = markdown.replace(/(AskTb[^\s\)]*)/i, '<span style="color: #f00">$1</span>');
									var markdownDiv = jQuery( '<div class="markdown">' ).append( markdown ).appendTo( issuediv );
									if ( this.comments > 0 ) {
										jQuery( '<a class="comment-count">' ).append( this.comments + " comment" + (this.comments === 1 ? "" : "s") ).appendTo( jQuery( issuediv ) ).attr({
											href: this.html_url,
											target: "github"
										});
									}
								});
								jQuery( ".markdown a" ).attr( "target", "sandcastle" );
							});
						});
						jQuery( "<span>" ).append( " (" + totalIssues + ") " ).appendTo( jQuery( "#tabs li a[href=#" + container + "]" ) );
					};
					populateDom( newIssues, "new-issues" );
					populateDom( taggedIssues.realbug, "realbug-issues" );
					populateDom( taggedIssues.notabug, "notabug-issues" );
					populateDom( taggedIssues.other, "comment-issues" );
					jQuery( ".exercise-list-item:first-child" ).trigger( 'click' );
					jQuery( "#loading" ).fadeOut( 200 );
				}
			});

		});
	}
	getIssues( 1 );
});

jQuery( document ).ready( function( event ) {
	jQuery( window ).trigger( 'resize' );
});

jQuery( window ).resize( function( event ) {
	var height = ( jQuery( window ).height() - 130 ) + "px";
	jQuery( ".exercise-list" ).css( "height", height );
	jQuery( ".issue-detail" ).css( "height", height );
});
