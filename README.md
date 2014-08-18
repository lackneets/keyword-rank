keyword-rank
============

This is a Version of Taiwan, the search result may differ due to your Country.

You may modify your own httpHeader for your country.


這是台灣專用版本，由於每個國家的搜尋結果可能不同

你可以自己修改httpHeader來對應你的國家

### Install
```
npm install -S "git+https://github.com/lackneets/keyword-rank.git"
```

### Usage

```javascript
var KeywordRank = require('keyword-rank');
var tracker = KeywordRank.Yahoo('小耀博士', 30); //Search 小耀博士 in first 30 results from YahooSearch

tracker.trackUrlMatch('www.plurk.com/Lackneets', function(results, index){
    console.log(results[index]);
});

```

### Result

```json
{ 
  title: '【科雲研究所】毎日Plurkで楽しみに過ごした日々、これが日常 - 面達姆博土 [Lackneets] on Plurk - Plurk',
  url: 'www.plurk.com/Lackneets',
  keyword: '小耀博士',
  source: 'Yahoo',
  rank: 1 
}
```
