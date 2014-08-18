var $ = require('cheerio');
var _ = require('underscore');
var fs = require('fs');
var request = require('request');

require('./plugins/underscore.indexof')(_);


function noop(){}

String.fromCharCodePoint = function( /* codepoints */ ) {
    var codeunits = [];
    for (var i = 0; i < arguments.length; i++) {
        var c = arguments[i];
        if (arguments[i] < 0x10000) {
            codeunits.push(arguments[i]);
        } else if (arguments[i] < 0x110000) {
            c -= 0x10000;
            codeunits.push((c >> 10 & 0x3FF) + 0xD800);
            codeunits.push((c & 0x3FF) + 0xDC00);
        }
    }
    return String.fromCharCode.apply(String, codeunits);
};
function decodeCharacterReferences(s) {
    return s.replace(/&#(\d+);/g, function(_, n) {;
        return String.fromCharCodePoint(parseInt(n, 10));
    }).replace(/&#x([0-9a-f]+);/gi, function(_, n) {
        return String.fromCharCodePoint(parseInt(n, 16));
    });
};


function KeywordTracker(keyword, maxrank) {
    this.maxrank = maxrank || 40;
    this.start = 0;
    this.httpHeaders = {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'accept-language': 'zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4,ja;q=0.2,zh-CN;q=0.2',
        'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36',
        'x-chrome-uma-enabled': 1,
        'x-client-data': 'CMq1yQEIibbJAQijtskBCKm2yQEIxLbJAQiehsoBCLiIygEI8YjKAQizk8oBCMWUygE='
    };
    this.keyword = keyword;
}
KeywordTracker.prototype = {
    results: [],
    delay: 250,
    source: 'Google',
    bodyParser: function(bodyHtml){
        bodyHtml = decodeCharacterReferences(bodyHtml);
        $body = $.load(bodyHtml);
        return $body('.srg .g').toArray();
    },
    itemParser: function(itemHTML) {
        return {
            title: $(itemHTML).find('a').first().text(),
            url: $(itemHTML).find('a').first().attr('href')
        }
    },
    buildUrl: function(keyword, start, https) {
        var protocal = (https === false ? 'http' : 'https');
        if (Number(start) > 0) {
            return [protocal, '://www.google.com/search', '?q=', keyword, '&start=', Number(start)].join('');
        } else {
            return [protocal, '://www.google.com/search', '?q=', keyword].join('');
        }
    }
};
KeywordTracker.prototype.track = function(callback) {
    var self = this;

    callback = (callback instanceof Function) ? callback : noop;

    if(self.start >= self.maxrank){
        return callback(self.results, false, noop);
    }

    var start = self.start;

    request({
        url: self.buildUrl(self.keyword, start),
        headers: self.httpHeaders
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {

            results = self.bodyParser(body);
            results = _(results).map(function(html){
                return _.extend({}, self.itemParser(html), {
                    keyword: self.keyword,
                    source: self.source,
                    rank: ++start
                });
            });


            self.start = Math.max(start, self.start);
            self.results = self.results.slice(0, start);
            self.results = self.results.concat(results);

            var hasNext = self.start < self.maxrank;
            var next = function(_callback) {
                setTimeout(function() { // Next 之前的等待時間，避免被Google黑名單
                    self.track(_callback || callback);
                }, self.delay);
            }

            return callback(self.results, hasNext, next);
        }
    });
}
KeywordTracker.prototype.trackUntil = function(condition, callback, maxrank){
    var self = this;
    var maxrank = maxrank || self.maxrank;

    self.track(function(results, hasNext, next) {
        if (hasNext && !_(results).any(condition)) {
            next();
        } else {
            var found = _(results).indexOf(condition);
            callback(results, found);
        }
    });
}
KeywordTracker.prototype.trackUrlMatch = function(urlPattern, callback, maxrank){
    this.trackUntil(function(e) {
        return e.url.match(urlPattern)
    }, function(results, index) {
        return callback(results, index);
    }, maxrank);
}

var KeywordRank = {
    Google: function(keyword, maxrank) {
        var tracker = new KeywordTracker(keyword, maxrank);
        return tracker;
    },
    Yahoo: function(keyword, maxrank) {
        var tracker = new KeywordTracker(keyword, maxrank);
        tracker.source = 'Yahoo';
        tracker.buildUrl = function(keyword, start, https) {
            var protocal = (https === false ? 'http' : 'https');
            if (Number(start) > 0) {
                return [protocal, '://tw.search.yahoo.com/search', '?p=', keyword, '&b=', Number(start)+1].join('');
            } else {
                return [protocal, '://tw.search.yahoo.com/search', '?p=', keyword].join('');
            }
        };

        tracker.bodyParser = function(bodyHtml){
            bodyHtml = decodeCharacterReferences(bodyHtml);
            $body = $.load(bodyHtml);
            return $body('#web ol li').toArray();
        };

        tracker.itemParser = function(itemHTML) {
            return {
                title: $(itemHTML).find('a').first().text(),
                url: $(itemHTML).find('span.url').first().text() || $(itemHTML).find('a').first().attr('href')
            }
        };
        return tracker;
    }
};

module.exports = KeywordRank