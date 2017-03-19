'use strict'

// when the node version is <= 0.12.Add assign function polyfill to the Object.
/* istanbul ignore if */
if (typeof Object.assign != 'function') {
	Object.assign = function (target, varArgs) { // .length of function is 2
		if (target == null) { // TypeError if undefined or null
			throw new TypeError('Cannot convert undefined or null to object');
		}

		var to = Object(target);

		for (var index = 1; index < arguments.length; index++) {
			var nextSource = arguments[index];
			if (nextSource != null) { // Skip over if undefined or null
				for (var nextKey in nextSource) {
					// Avoid bugs when hasOwnProperty is shadowed
					if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
						to[nextKey] = nextSource[nextKey];
					}
				}
			}
		}
		return to;
	};
}

var rcache = function () {
	this.options = {
		'ttl': 0, //ttl is the default cache live time, value is 0 means we will never delete it.(ttl unit is millisecond)
		'errorOrNull': false, //throw a error or return a null when delete or get a not exist key,default false means will return a null value
		'autoRefresh': true, // autoRefresh means your key has the ability to refresh itself. default true means turn on this function.
		'refreshInterval': 10000, //only availible when the autoRefresh is setting to true.
	};
	// all the cache data will be saved in this.cache object.
	this.cache = {};
	this.stat = {
		keys: 0
	}
}

rcache.prototype = {
	_set: _set,
	_delete: _delete,
	_get: _get,
	init: init,
	setSync: setSync,
	setAsync: setAsync,
	getSync: getSync,
	getAsync: getAsync,
	deleteSync: deleteSync,
	deleteAsync: deleteAsync,
	flushAllSync: flushAllSync,
	flushAllAsync: flushAllAsync,
	setAutoRefresh: setAutoRefresh,
	isExistKey: isExistKey,
	// getStat function will return the stat of the cache.
	getStat: function () {
		return this.stat;
	},
	// keysNumber function will return cached keys number.
	// input: ()
	// return:number
	keysNumber: function () {
		return this.stat.keys;
	},

	// keys function will return all cached keys.
	// input: ()
	// return:[key1,key2...]
	keys: function () {
		return Object.keys(this.cache);
	}
}


// _get function will get the key from the cache
// return null or throw a error when the key not exist (based on the options).
// return the value when the key is exist.
function _get(key) {
	if (!key) {
		throw new Error('InputArgumentsError');
	}
	if (!this.isExistKey(key)) {
		throw new Error('NotExistKeyError');
	}
	return this.cache[key].value;
}


// _set function will set the key with the value and the timer for delete the key in future.
// return : true when the key set success. false when the key not set properly.
function _set(key, value, ttl) {
	if (this.isExistKey(key)) {
		// clean the key and update with the new value.
		this._delete(key);
	}
	var self = this;
	this.cache[key] = {
		value: value,
		timer: (ttl === 0) ? null : setTimeout(function () {
			self._delete(key);
		}, ttl),
		refreshFunc: null,
		refreshTimer: null
	};
	this.stat.keys++;
	return true;
}

// _delete will delete the key and the timer.
// return : true when the key delete success. false when the key not exist.
function _delete(key) {
	// clear timer and delete the key
	if (!key) {
		throw new Error('InputArgumentsError');
	}
	if (!this.isExistKey(key)) {
		throw new Error('NotExistKeyError');
	}
	var obj = this.cache[key];
	if (obj.timer) {
		clearTimeout(obj.timer);
	}
	if (obj.refreshTimer) {
		clearInterval(obj.refreshTimer);
	}
	delete this.cache[key];
	this.stat.keys--;
	return true;
}

// custom setting.
function init(options) {
	if (typeof options !== 'undefined') {
		// if options exist, will merge the default and the input options.
		this.options = Object.assign({}, this.options, options);
	}
}
// isExistKey will return true when the key is in the cache, false means not exist.
function isExistKey(key) {
	return ((typeof (this.cache[key])) !== "undefined")
}

// setSync function will insert a new key to the cache in sync way.
// if ttl not exist as the third params, the default will be given.
//
function setSync(key, value, ttlValue) {
	var args = Array.prototype.slice.call(arguments);
	if (args.length < 2) {
		throw new Error('InputArgumentsError');
	}
	var ttl = (args.length > 2 && typeof ttlValue === 'number') ? args[2] : this.options.ttl;
	try {
		this._set(key, value, ttl);
		return true;
	} catch (e) {
		if (this.options.errorOrNull) {
			throw e;
		} else {
			return null;
		}
	}
}
// setAsync function will insert a new key to the cache in async way.
// input should be (key,value,ttl,function(){}) or (key,value,function(){})
function setAsync(key, value, ttlValue, callback) {
	var args = Array.prototype.slice.call(arguments);
	var ttl = this.options.ttl;
	var cb = null;
	var self = this;
	if (args.length === 3 && typeof args[2] === 'function') {
		cb = args[2];
	} else if (args.length === 4 && typeof ttlValue === 'number' && typeof callback === 'function') {
		ttl = ttlValue;
		cb = callback;
	} else {
		throw new Error('InputArgumentsError');
	}
	process.nextTick(function () {
		try {
			self._set(key, value, ttl)
			cb(null);
		} catch (e) {
			cb(e);
		}
	});
}


// deleteSync will delete the key and return true when delete success it.
function deleteSync(key) {
	try {
		return this._delete(key);;
	} catch (e) {
		if (this.options.errorOrNull) {
			throw e;
		} else {
			return null;
		}
	}
}

function deleteAsync(key, callback) {
	var args = Array.prototype.slice.call(arguments);
	var self = this;
	if (args.length === 2 && typeof callback === 'function') {
		process.nextTick(function () {
			try {
				self._delete(key);
				callback(null);
			} catch (err) {
				callback(err, null);
			}
		});
	} else {
		throw new Error('InputArgumentsError');
	}
}

function getSync(key) {
	try {
		return this._get(key);
	} catch (err) {
		if (this.options.errorOrNull) {
			throw err;
		} else {
			return null;
		}
	}

}

function getAsync(key, callback) {
	var args = Array.prototype.slice.call(arguments);
	var self = this;
	if (args.length === 2 && typeof callback === 'function' && key) {
		process.nextTick(function () {
			try {
				var value = self._get(key);
				callback(null, self._get(key))
			} catch (e) {
				callback(e, null);
			}
		});
	} else {
		throw new Error('InputArgumentsError');
	}
}

function flushAllSync() {
	try {
		var self = this;
		this.keys().map(function (key) {
			self._delete(key);
		})
		return true
	} catch (e) {
		if (this.options.errorOrNull) {
			throw e;
		}
		return null;
	}
}

function flushAllAsync(callback) {
	if (callback && typeof callback === 'function') {
		var self = this;
		process.nextTick(function () {
			try {
				for (key in this.cache) {
					self._delete(key);
				}
				return callback(null);
			} catch (e) {
				return callback(e);
			}
		});
	}
}


// setAutoRefresh function will enable the auto refresh to the key and set its refresh time interval
// input: key , callback() ,timeInterval
// return true or false;

// callback param must have a input param and its type must be function , and this function has the newValue as its first param
// for example:

// setAutoRefresh('user',function(cb){
//     User.findOne({},function(err,docs){
//         cb(docs);
//     });
// },10000);

function setAutoRefresh(key, callback, timeInterval) {
	if (!this.options.autoRefresh || !this.isExistKey(key)) {
		return false;
	}
	var args = Array.prototype.slice.call(arguments);
	var cb = null;
	var interval = null;
	if (args.length === 2 && typeof callback === 'function') {
		cb = callback;
		interval = this.options.refreshInterval;
	} else if (args.length === 3 && typeof callback === 'function' && typeof timeInterval === 'number') {
		cb = callback;
		interval = timeInterval;
	} else {
		return false;
	}
	var self = this;
	var refreshTimer = setInterval(function () {
		cb(function (newValue) {
			if (self.isExistKey(key)) {
				self.cache[key].value = newValue;
			}
		})
	}, interval);
	this.cache[key].refreshTimer = refreshTimer;
	return true;
}

module.exports = new rcache();
