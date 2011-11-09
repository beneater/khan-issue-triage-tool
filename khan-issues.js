// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

jQuery( function() {
	jQuery( "#tabs" ).tabs();
	jQuery( "#loading" ).fadeIn( 200 );
	jQuery.getJSON( 'http://github.com/api/v2/json/issues/list/Khan/khan-exercises/open?callback=?', function( data ) {
		newIssues = {};
		commentIssues = {};
		realbugIssues = {};
		notabugIssues = {};
		converter = new Showdown.converter();

		jQuery.each( data.issues, function() {
			if ( this.user == "KhanBugz" ) {
				var exerciseName = this.title.split(" - ")[0];
				if ( this.comments > 0 ) {
					if ( exerciseName in commentIssues ) {
						commentIssues[ exerciseName ].push( this );
					} else {
						commentIssues[ exerciseName ] = [ this ];
					}
				} else {
					if ( exerciseName in newIssues ) {
						newIssues[ exerciseName ].push( this );
					} else {
						newIssues[ exerciseName ] = [ this ];
					}
				}
			}
		});

		jQuery.getJSON( 'http://github.com/api/v2/json/issues/search/Khan/khan-exercises/open/realbug?callback=?', function( data ) {
			jQuery.each( data.issues, function() {
				if ( this.user == "KhanBugz" ) {
					var exerciseName = this.title.split(" - ")[0];
					if ( exerciseName in realbugIssues ) {
						realbugIssues[ exerciseName ].push( this );
					} else {
						realbugIssues[ exerciseName ] = [ this ];
					}
					var issueNum = this.number;
					var removeIndex = -1;
					jQuery.grep( commentIssues[ exerciseName ], function( element, index ) {
						if ( element.number === issueNum ) {
							removeIndex = index;
						};
					});
					if ( removeIndex !== -1 ) {
						commentIssues[ exerciseName ].remove( removeIndex );
					}
				}
			});

			jQuery.getJSON( 'http://github.com/api/v2/json/issues/search/Khan/khan-exercises/open/notabug?callback=?', function( data ) {
				jQuery.each( data.issues, function() {
					if ( this.user == "KhanBugz" ) {
						var exerciseName = this.title.split(" - ")[0];
						if ( exerciseName in notabugIssues ) {
							notabugIssues[ exerciseName ].push( this );
						} else {
							notabugIssues[ exerciseName ] = [ this ];
						}
						var issueNum = this.number;
						var removeIndex = -1;
						jQuery.grep( commentIssues[ exerciseName ], function( element, index ) {
							if ( element.number === issueNum ) {
								removeIndex = index;
							};
						});
						if ( removeIndex !== -1 ) {
							commentIssues[ exerciseName ].remove( removeIndex );
						}
					}
				});

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
								var markdown = converter.makeHtml( this.body );
								markdown = markdown.replace(/(AskTb[^\s\)]*)/, '<span style="color: #f00">$1</span>');
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
				populateDom( realbugIssues, "realbug-issues" );
				populateDom( notabugIssues, "notabug-issues" );
				populateDom( commentIssues, "comment-issues" );
				jQuery( ".exercise-list-item:first-child" ).trigger( 'click' );
				jQuery( "#loading" ).fadeOut( 200 );
			});
		});
	});
})

jQuery( document ).ready( function( event ) {
	jQuery( window ).trigger( 'resize' );
});

jQuery( window ).resize( function( event ) {
	var height = ( jQuery( window ).height() - 130 ) + "px";
	jQuery( ".exercise-list" ).css( "height", height );
	jQuery( ".issue-detail" ).css( "height", height );
});
