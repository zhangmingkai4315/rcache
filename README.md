# rcache
rcache is a node cache module for cache your data. Using rcache, you can set, get, delete the data in your cache, and even custom the auto refresh function to reload the data.

All the functions for handle your cache data will include two ways, sync and async version. So there will be like ```getSync``` or ```getAsync``` function.


[![Build Status](https://travis-ci.org/zhangmingkai4315/rcache.svg?branch=master)](https://travis-ci.org/zhangmingkai4315/rcache)

## Getting started

```
npm install rcache --save
```

## Usage

### Init your cache object
```
var cache = require('rcache');
```
This init way will using the default settings.All the settings will be list here:

```
'ttl': 0, //ttl is the default cache live time, value is 0 means we will never delete it.(ttl unit is millisecond)

'errorOrNull': false, //throw a error or return a null when delete or get a not exist key,default false means will return a null value

'autoRefresh': true, // autoRefresh means your key has the ability to refresh itself. default true means turn on this function.

'refreshInterval': 10000, //only availible when the autoRefresh is setting to true.
```

You can custom it using ```cache.init()``` function

```
var cache = require('rcache');
cache.init({'ttl':10000});
```


### Set new key-value.

```
var cache = require('rcache');
cache.setSync('hello','world');
cache.setAsync('hello1','world1',function(err){
    if(!err){
        console.log('setting success');
    }
});
```

If the cache already has the key you want to set, just replace it and refresh its ttl. There also no limit about size of the cache data, maybe later will add some limitations.


### Get the key-value.

```
var cache = require('rcache');
var val = cache.getSync('hello');
cache.getAsync('hello',function(err,val){
    if(!err){
        console.log('get value success');
    }
});
```

If the key not in the cache ,the getSync will return null or throw a error based your option: ```errorOrNull```.

### Delete the key-value.

```
var cache = require('rcache');
var ifSuccess = cache.deleteSync('hello');
cache.deleteAsync('hello',function(err){
    if(!err){
        console.log('delete key success');
    }
});
```
If the key not in the cache ,the deleteSync will return null or throw a error based your option: ```errorOrNull```.

### Flush all cached data.

```
var cache = require('rcache');
var ifSuccess = cache.flushAllSync();
cache.flushAllSync('hello',function(err){
    if(!err){
        console.log('flushAll keys success');
    }
});
```

### Set auto refresh

Auto refresh function  will auto update the value in your cache based its callback function.

```
var cache = require('rcache');
cache.setSync('user',[{"name":"mike"},{"name":"alice"}]);
setAutoRefresh('user',function(cb){
     User.find({},function(err,docs){
         cb(docs);
     });
},10000);
```

### Other functions 

- ```keys()```: get the list of the keys in your cache
- ```keysNumber()```: get the number of the cached keys.
- ```getStat()```: get the stat of the cache.
- ```isExistKey()```:check if the key in your cache.
