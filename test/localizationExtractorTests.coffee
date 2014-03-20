assert = require('chai').assert
localizationExtractor = require '../app/js/localization/localizationExtractor'

describe "localizationExtractor", ->
  describe "findInJs", ->
    it "finds strings", ->
      code = '''
        var func = function() {
          var x = 5;
          console.log(T("test1"));
          console.log(T('test2'));
          console.log(T('test"quote'));
          console.log(T("test\\"quote2"));
        }
      '''
      assert.deepEqual localizationExtractor.findInJs(code), 
        ['test1', 'test2', 'test"quote', 'test"quote2']

  describe "findInCoffee", ->
    it "finds strings", ->
      code = '''
$ ->
  x = 5
  console.log T("test1")
  console.log T('test2')
  console.log T('test"quote')
  console.log T("test\\"quote2")
      '''
      assert.deepEqual localizationExtractor.findInCoffee(code), 
        ['test1', 'test2', 'test"quote', 'test"quote2']

    it "finds multiline strings", ->
      code = "x = T('''somestring\nanotherline''')"
      assert.deepEqual localizationExtractor.findInCoffee(code), 
        ['somestring\nanotherline']

  describe "findInHbs", ->
    it "finds strings", ->
      code = '''
        {{T 'some string'}}
        T 'not this'
        {{T "another string"}}
      '''
      assert.deepEqual localizationExtractor.findInHbs(code), 
        ['some string', 'another string']

    it "finds strings in clauses", ->
      code = '''
        {{#if x}}
          {{T 'some string'}}
          {{#each y}}
            {{T "another string"}}
          {{/each}}
        {{/if}}
      '''
      assert.deepEqual localizationExtractor.findInHbs(code), 
        ['some string', 'another string']

    it "allows empty clauses", ->
      code = '''
        {{#if x}}{{/if}}
        {{#each y}}{{/each}}
      '''
      assert.deepEqual localizationExtractor.findInHbs(code), 
        []


