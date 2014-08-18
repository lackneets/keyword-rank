var KeywordRank = require('./lib/KeywordRank.js');
var tracker = KeywordRank.Yahoo('小耀博士', 30);

tracker.trackUrlMatch('www.plurk.com/Lackneets', function(results, index){
    console.log(results[index]);
});