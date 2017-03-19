'use strict'

var mocha = require('mocha');
var expect = require('expect');
var sinon = require('sinon');
var rcache = require('../index');

var clock=null;
beforeEach(function() {
  clock = sinon.useFakeTimers();
  return rcache.flushAllSync();
});
afterEach(function () {
    clock.restore();
});
describe('Cache Function Test',function(){
    describe('Set Function Test in Sync Way',function(){
        it('Should set a new key in cache without expire',function(){
            rcache.setSync('hello','world');
            expect(rcache.getSync('hello')).toBe('world');
            expect(rcache.cache['hello']).toEqual({
                refreshFunc: null,
                refreshTimer: null,
                timer: null,  //delete timer is not set.
                 value: 'world'});
            expect(rcache.keysNumber()).toEqual(1);
        });
        it('Should set a new key in cache with expire 3 seconds',function(){
            rcache.setSync('hello','world',3000);
            expect(rcache.getSync('hello')).toBe('world');
            expect(rcache.cache['hello']['timer']).toNotBe(null);
            expect(rcache.keysNumber()).toEqual(1);
            clock.tick(3001);
            expect(rcache.getSync('hello')).toBe(null);
            expect(rcache.cache['hello']).toBe(undefined);
            expect(rcache.keysNumber()).toEqual(0);
        });

        it('Should set a new key in cache to replace the old value',function(){
            rcache.setSync('hello','world');
            rcache.setSync('hello','world2');
            expect(rcache.getSync('hello')).toBe('world2');
            expect(rcache.cache['hello']['timer']).toBe(null);
            expect(rcache.keysNumber()).toEqual(1);
        });
        it('Should throw a error without correct input key,value',function(){
            // expect(rcache.setSync('hello')).toThrow('Input arguments at least include key and value.');
            expect(function(){
                rcache.setSync('hello');
            }).toThrow('InputArgumentsError');
            expect(function(){
                rcache.setSync();
            }).toThrow('InputArgumentsError')
        });
    });
    describe('Set Function Test in Aysnc Way',function(){
        it('Should set a new key in cache without expire',function(done){
            rcache.setAsync('hello','world',function(err){
                expect(err).toBe(null);
                expect(rcache.getSync('hello')).toBe('world');
                expect(rcache.cache['hello']).toEqual({
                    refreshFunc: null,
                    refreshTimer: null,
                    timer: null,  //delete timer is not set.
                    value: 'world'});
                expect(rcache.keysNumber()).toEqual(1);
                done();
            });
        });
        it('Should set a new key in cache with expire 3 seconds',function(done){
            rcache.setAsync('hello','world',3000,function(err){

                expect(err).toBe(null);
                expect(rcache.getSync('hello')).toBe('world');
                expect(rcache.cache['hello']['timer']).toNotBe(null);
                expect(rcache.keysNumber()).toEqual(1);
                clock.tick(3001);
                expect(rcache.getSync('hello')).toBe(null);
                expect(rcache.cache['hello']).toBe(undefined);
                expect(rcache.keysNumber()).toEqual(0);
                setImmediate(done());

            });
        });
        it('Should throw a error without correct input key,value',function(){
           expect(function(){
                rcache.setAsync('hello');
            }).toThrow('InputArgumentsError')
        });
    });


    describe('Get Function Test in Sync Way',function(){
        it('Should get a value in cache when the key has already in cache and not expired',function(){
            rcache.setSync('hello','world');
            expect(rcache.isExistKey('hello')).toBe(true);
            expect(rcache.cache['hello']['timer']).toBe(null);
            expect(rcache.getSync('hello')).toBe('world');
        });
        it('Should get a null in cache when the key not in cache or expired',function(){
            expect(rcache.getSync('NotExistKey')).toBe(null);
            expect(rcache.isExistKey('NotExistKey')).toBe(false);
        });
        it('Should throw a error when the key not in the cache.',function(){
            rcache.init({errorOrNull:true});
            expect(function(){rcache.getSync('NotExistKey')}).toThrow('NotExistKeyError');
            expect(rcache.isExistKey('NotExistKey')).toBe(false);
        });
        it('Should throw a error without correct input key',function(){
            expect(function(){
                rcache.getSync();
            }).toThrow('InputArgumentsError')
        });
    });
    describe('Get Function Test in Aysnc Way',function(){
        it('Should get a value in cache when the key has already in cache and not expired',function(done){
            rcache.setSync('hello','world');
            rcache.getAsync('hello',function(err,value){
                expect(err).toBe(null);
                expect(value).toBe('world');
                expect(rcache.cache['hello']).toEqual({
                    refreshFunc: null,
                    refreshTimer: null,
                    timer: null,  //delete timer is not set.
                    value: 'world'});
                expect(rcache.keysNumber()).toEqual(1);
                done();
            });
        });
        it('Should get a value in cache with expire time 3 seconds',function(done){
            rcache.setSync('hello','world',3000);
            rcache.getAsync('hello',function(err,value){
                expect(err).toBe(null);
                expect(value).toBe('world');
                expect(rcache.keysNumber()).toEqual(1);
                clock.tick(3001);
                rcache.getAsync('hello',function(err,value){
                    expect(err).toNotBe(null);
                    expect(value).toBe(null);
                    done();
                });
            });
        });
        it('Should throw a error without correct input key,value',function(){
           expect(function(){
                rcache.getAsync();
            }).toThrow('InputArgumentsError')
        });
    });

    describe('Delete Function Test in Sync Way',function(){
        it('Should delete a key-value in cache',function(){
            rcache.init({'errorOrNull':false});
            rcache.setSync('hello','world');
            expect(rcache.getSync('hello')).toBe('world');
            expect(rcache.keysNumber()).toEqual(1);
            expect(rcache.deleteSync('hello')).toBe(true);
            expect(rcache.isExistKey('hello')).toBe(false);
            expect(rcache.getSync('hello')).toBe(null);
            expect(rcache.keysNumber()).toEqual(0);
        });

        it('Should delete a key-value in cache(with 3000ms ttl)',function(){
            rcache.init({'errorOrNull':false});
            rcache.setSync('hello','world',3000);
            expect(rcache.getSync('hello')).toBe('world');
            expect(rcache.keysNumber()).toEqual(1);
            expect(rcache.deleteSync('hello')).toBe(true);
            expect(rcache.getSync('hello')).toBe(null);
            expect(rcache.isExistKey('hello')).toBe(false);
            expect(rcache.keysNumber()).toEqual(0);
        });

        it('Should delete nothing when the key not in cache',function(){
            rcache.init({'errorOrNull':true});
            expect(function(){rcache.deleteSync('notexist')}).toThrow('NotExistKeyError');
        });
        it('Should throw a error without correct input key,value',function(){
            expect(function(){rcache.deleteSync();}).toThrow('InputArgumentsError');
        });

        it('Should delete nothing when the key not in cache',function(){
            rcache.init({'errorOrNull':false});
            expect(rcache.deleteSync('notexist')).toBe(null);
        });
        it('Should return false without correct input key,value[errorOrNull:false]',function(){
            expect(rcache.deleteSync()).toBe(null);
        });

    });

    describe('Delete Function Test in Async Way',function(){
        it('Should delete a key-value in cache',function(done){
            rcache.setSync('hello','world');
            expect(rcache.getSync('hello')).toBe('world');
            expect(rcache.keysNumber()).toEqual(1);
            rcache.deleteAsync('hello',function(err){
                expect(err).toBe(null);
                expect(rcache.isExistKey('hello')).toBe(false);
                done();
            })
        });

        it('Should delete a key-value in cache(with 3000ms ttl)',function(done){
            rcache.setSync('hello','world',3000);
            expect(rcache.getSync('hello')).toBe('world');
            expect(rcache.keysNumber()).toEqual(1);
            rcache.deleteAsync('hello',function(err){
                expect(err).toBe(null);
                expect(rcache.isExistKey('hello')).toBe(false);
                done();
            })
        });

        it('Should delete nothing when the key not in cache',function(done){
             rcache.deleteAsync('NotExistKey',function(err){
                expect(err).toNotBe(null);
                done();
            });
        });
        it('Should throw a error without correct input key,value',function(done){
            expect(function(){
                rcache.deleteAsync();
            }).toThrow('InputArgumentsError');
            done();
        });
    });


    describe('FlushAll Function Test in Sync Way',function(){
        it('Should FlushAll key-value in cache',function(){
            rcache.init({'errorOrNull':false});
            rcache.setSync('hello','world');
            rcache.setSync('hello1','world1',3000);
            expect(rcache.getSync('hello')).toBe('world');
            expect(rcache.keysNumber()).toEqual(2);
            rcache.flushAllSync();
            expect(rcache.getSync('hello')).toBe(null);
            expect(rcache.getSync('hello1')).toBe(null);
            expect(rcache.keysNumber()).toEqual(0);
        });
    });

    describe('FlushAll Function Test in Async Way',function(){
        it('Should FlushAll key-value in cache',function(){
            rcache.init({'errorOrNull':false});
            rcache.setSync('hello','world');
            rcache.setSync('hello1','world1',3000);
            expect(rcache.getSync('hello')).toBe('world');
            expect(rcache.keysNumber()).toEqual(2);
            rcache.flushAllAsync(function(err){
                expect(err).toBe(null);
                expect(rcache.getSync('hello')).toBe(null);
                expect(rcache.getSync('hello1')).toBe(null);
                expect(rcache.keysNumber()).toEqual(0);
                done();
            });
        });
    });
    describe('setAutoRefresh Functions Test',function(){
        it('setAutoRefresh should set the key auto refresh in cache',function(done){
            rcache.setSync('autoRefreshKey',0);
            rcache.setAutoRefresh('autoRefreshKey',function(cb){
                cb(newValue);
            },10000);
            expect(rcache.getSync('autoRefreshKey')).toBe(0);
            var newValue = 1;
            setInterval(function(){
                newValue=newValue*2;
            },5000);
            clock.tick(10000);
            expect(rcache.getSync('autoRefreshKey')).toBe(newValue/2);
            done();
        });
        it('setAutoRefresh should set the key auto refresh in cache with default refresh interval.',function(done){
            rcache.setSync('autoRefreshKey',0);
            rcache.setAutoRefresh('autoRefreshKey',function(cb){
                cb(newValue);
            });
            expect(rcache.getSync('autoRefreshKey')).toBe(0);
            var newValue = 1;
            setInterval(function(){
                newValue=newValue*2;
            },2000);
            clock.tick(10001);
            expect(rcache.getSync('autoRefreshKey')).toBe(newValue/2);
            done();
        });
        it('setAutoRefresh should not work when the autoRefresh is turn off',function(done){
            rcache.init({'autoRefresh':false});
            rcache.setSync('autoRefreshKey',0);
            rcache.setAutoRefresh('autoRefreshKey',function(cb){
                cb(newValue);
            },10000);
            expect(rcache.getSync('autoRefreshKey')).toBe(0);
            var newValue = 1;
            setInterval(function(){
                newValue=newValue*2;
            },5000);
            clock.tick(10000);
            expect(rcache.getSync('autoRefreshKey')).toBe(0);
            done();
        });
    })
    describe('Other Functions Test',function(){
        it('isExistKey should return a the key exist status in cache',function(){
            rcache.setSync('hello','world');
            rcache.setSync('hello1','world1',3000);
            expect(rcache.isExistKey('hello')).toBe(true);
            expect(rcache.isExistKey('hello1')).toBe(true);
            clock.tick(3001);
            expect(rcache.isExistKey('hello')).toBe(true);
            expect(rcache.isExistKey('hello1')).toBe(false);
        });
       it('getStat should return a cache stat infomation object',function(){
            rcache.setSync('hello','world');
            rcache.setSync('hello1','world1',3000);
            expect(rcache.getStat()).toEqual({
                keys:2
            });
            clock.tick(3001);
            expect(rcache.getStat()).toEqual({
                keys:1
            });
        });

        it('getStat should return a cache stat infomation object',function(){
            rcache.setSync('hello','world');
            rcache.setSync('hello1','world1',3000);
            expect(rcache.getStat()).toEqual({
                keys:2
            });
            clock.tick(3001);
            expect(rcache.getStat()).toEqual({
                keys:1
            });
        });
        it('keysNumber should return a total number of keys in cache',function(){
            rcache.setSync('hello','world');
            rcache.setSync('hello1','world1',3000);
            expect(rcache.keysNumber()).toEqual(2);
            clock.tick(3001);
            expect(rcache.keysNumber()).toEqual(1);
        });
        it('keys should return a keys array in cache',function(){
            rcache.setSync('hello','world');
            rcache.setSync('hello1','world1',3000);
            expect(rcache.keys()).toEqual(['hello','hello1']);
            clock.tick(3001);
            expect(rcache.keys()).toEqual(['hello']);
        });
    });


});
