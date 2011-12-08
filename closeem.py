#!/usr/bin/python
import json
from contextlib import closing
import urllib2
import base64
import re
import getpass

print
print "This script will close all issues opened by KhanBugz"
print "with 'notabug' (case-insensitive) in a comment."
print

github_user = raw_input("GitHub username [%s]: " % getpass.getuser())
if not github_user:
    github_user = getpass.getuser()

github_pass = getpass.getpass()

basic_auth_str = base64.encodestring('%s:%s' % (github_user, github_pass))[:-1]

realbug_taggers = {}
notabug_taggers = {}

def close_issues(page):
    with closing(urllib2.urlopen("https://api.github.com/repos/Khan/khan-exercises/issues?page=" + str(page) + "&per_page=100")) as issue_data:

        issues = json.loads(issue_data.read())
        for issue in issues:
            if issue['comments'] > 0 and issue['user']['login'] == "KhanBugz":
                with closing(urllib2.urlopen("https://api.github.com/repos/Khan/khan-exercises/issues/" + str(issue['number']) + "/comments?per_page=100")) as comment_data:
                    comments = json.loads(comment_data.read())
                    comment_text = ""
                    for comment in comments:
                        comment_text += comment['body'].lower();

                    if comment_text.find("realbug") != -1:
                        try:
                            realbug_taggers[comment['user']['login']] += 1
                        except:
                            realbug_taggers[comment['user']['login']] = 1
                    elif comment_text.find("notabug") != -1:
                        try:
                            notabug_taggers[comment['user']['login']] += 1
                        except:
                            notabug_taggers[comment['user']['login']] = 1
                        issue['state'] = "closed"
                        req = urllib2.Request("https://api.github.com/repos/Khan/khan-exercises/issues/%s" % issue['number'], json.dumps(issue) )
                        req.add_header("Authorization", "Basic %s" % basic_auth_str)
                        try:
                            urllib2.urlopen(req)
                            print "closed issue %s (%s)" % ( issue['number'], comment['user']['login'] )
                        except IOError, e:
                            print "error closing %s (%s): %s" % ( issue['number'], comment['user']['login'], e )

        if re.findall(r'<(.*?)>; rel="(.*?)"', issue_data.info().getheader("Link"))[0][1] == "next":
            close_issues( page + 1 )

close_issues(1)

print
print "notabug taggers:"
for tagger in notabug_taggers:
    print notabug_taggers[tagger], tagger
print
print "realbug taggers:"
for tagger in realbug_taggers:
    print realbug_taggers[tagger], tagger
