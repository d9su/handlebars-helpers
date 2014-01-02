/**
 * Handlebars Helpers: Layout Helpers
 * Copyright (c) 2013 Jon Schlinkert, Brian Woodward, contributors
 * Licensed under the MIT License (MIT).
 */
'use strict';

/**
 * These helpers are inspired by handlebars-layouts.
 * https://github.com/shannonmoeller/handlebars-layouts *
 */


// Export helpers
module.exports.register = function (Handlebars, opts) {
  opts = opts || {};

  function hasReplace(blocks){
    var found = false;
    blocks.forEach(function(block){
      if(block.mode.toLowerCase() === 'replace'){
        found = true;
        return false;
      }
    });

    return found;
  }

  var helpers = {

    /**
     * Extend a layout that contains block definitions
     * @param  {String} layout  name of the layout to extend
     * @param  {Object} options normal handlebars options
     * @return {String}         rendered layout
     */
    extend: function (layout, options) {
      var output = null;
      var context = Object.create(this);
      var template = Handlebars.partials[layout];

      if (typeof template === 'undefined') {
        throw new Error("Missing layout: '" + layout + "'");
      }

      options.fn(context);

      return Handlebars.compile(template)(context);

    },


    /**
     * Used within layouts to define block sections
     * @param  {String} name    name of block to be referenced later
     * @param  {Object} options normal handlebars options
     * @return {String}         rendered block section
     */
    block: function (name, options) {
      this.blocks = this.blocks || {};
      var blocks = this.blocks[name] || [];

      // don't parse block content if it will be replaced
      var out = '';
      if(!hasReplace(blocks)){
        out = options.fn(this);
      }

      blocks.reverse().forEach(function(block){
        switch (block && block.mode.toLowerCase()) {
          case 'append':
            out = out + block.content;
            return;

          case 'prepend':
            out = block.content + out;
            return;

          case 'replace':
            out = block.content;
            return;
        }
      });

      return out;
    },


    /**
     * Used within templates that extend a layout to define
     * content that will replace block sections
     * @param  {String} name    name of the block to replace
     * @param  {Object} options normal handlebars options
     * @return {String}         rendered content section
     */
    content: function (name, options) {
      options = options || {};
      options.hash = options.hash || {};
      var mode = options.hash['mode'] || 'replace';

      this.blocks = this.blocks || {};
      this.blocks[name] = this.blocks[name] || [];

      // ignore content that will be overridden
      if(hasReplace(this.blocks[name])){
        return '';
      }

      this.blocks[name].push({
        mode: mode.toLowerCase(),
        content: options.fn(this)
      });
    }


    /**
     * Used within templates to include partials with custom context
     * @param  {String} partial         name of the partial to include
     * @param  {Object} partialContext  custom context to be passed to partial
     * @param  {Object} rootContext     custom root context to be passed to partial
     * @param  {Object} options         normal handlebars options
     * @return {String}                 rendered content section
     */
    blockPartial: function(partial, partialContext, rootContext, options){
      // fix arguments passed by handlebars
      if(arguments.length < 4){
        rootContext = null;
      }
      if(arguments.length < 3){
        partialContext = null;
      }

      // defaults
      partialContext = partialContext || Object.create(this);
      rootContext = rootContext || this;

      // inject blocks from parent context
      if(typeof rootContext.blocks === 'object'){
        partialContext.blocks = rootContext.blocks;
      }

      // get partial
      var template = Handlebars.partials[partial];
      if (typeof template === 'undefined') {
        throw new Error("Missing layout: '" + partial + "'");
      }

      // render
      return Handlebars.compile(template)(partialContext);
    }

  };


  for (var helper in helpers) {
    if (helpers.hasOwnProperty(helper)) {
      Handlebars.registerHelper(helper, helpers[helper]);
    }
  }
};
