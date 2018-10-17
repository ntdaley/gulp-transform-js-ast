/*
 * Copyright 2014 Nicholas Daley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
var applySourceMap = require('vinyl-sourcemaps-apply');
var builders = require('ast-types').builders;
var convert = require('convert-source-map');
var PluginError = require("plugin-error");
var recast = require('recast');
var through = require('through2');
var transfer = require('multi-stage-sourcemap').transfer;

/**
 * Creates AST for the expression 'void 0'.
 * Often useful for removing expressions.
 */
var voidExpression = function() {
    return builders.unaryExpression(
        'void', builders.literal(0)
    );
};
/**
 * Creates a visitor that will replace an expression with 'void 0' if the predicate returns true.
 * Predicate takes the same path that is passed to the visitor.  The predicate should return true
 * if the expression should be replaced.
 */
var removeExpressionIf = function removeExpressionIf(predicate) {
    if( predicate === true ) {
        predicate = function() {
            return true;
        };
    }
    return function(path) {
        if( predicate( path ) ) {
            return voidExpression();
        }
        return path.value;
    };
};
/**
 * Returns a predicate function that will return true if the path passed to the predicate refers to a
 * function call expression on the object called objectId.
 * e.g. isCallToMethodIn('console') will return true for expressions of the form console.anyFunctionName()
 */
var isCallToMethodIn = function isCallToMethodIn(objectId) {
    var result = function(path) {
        var node = path.value;
        return node.type === 'CallExpression' &&
            node.callee &&
            node.callee.type === 'MemberExpression' &&
            node.callee.object &&
            node.callee.object.type === 'Identifier' &&
            node.callee.object.name === objectId &&
            node.callee.property;
        };
    return result;
};

/**
 * Transforms a single file from the gulp/vinyl stream.
 */
var transform = function transform(file, encoding, options) {
    var inputMap =file.sourceMap;
    var inputSource = file.contents.toString(encoding);
    var ast = recast.parse(inputSource, {
        sourceFileName : file.relative
    });

    recast.visit(ast, options);

    var output = recast.print(ast, {sourceMapName : file.relative + '.map'});

    file.contents = new Buffer(output.code);
    if( inputMap ) {
        var outputMap = convert.fromJSON(JSON.stringify(output.map));
        outputMap.setProperty('sources', inputMap.sources);
        outputMap.setProperty('sourcesContent', inputMap.sourcesContent);
        var mergedSourceMap;
        if(inputMap.mappings === '') {
            applySourceMap(file, outputMap.toJSON());
            mergedSourceMap = convert.fromObject(file.sourceMap);
        } else {
            mergedSourceMap = convert.fromJSON( transfer({
                fromSourceMap : JSON.parse(outputMap.toJSON()),
                toSourceMap : inputMap
            }) );
        }
        mergedSourceMap.setProperty('sources', inputMap.sources);
        mergedSourceMap.setProperty('sourcesContent', inputMap.sourcesContent);
	mergedSourceMap.setProperty('file', inputMap.file);
        file.sourceMap = mergedSourceMap.toObject();
    }
};

var gulpTransform = function(options) {
    return through.obj(function(file, encoding, callback) {
        encoding = encoding || 'utf8';
        if(file.isNull()) {
            this.push(file);
        } else if(file.isBuffer()) {
            transform(file, encoding, options);
            this.push(file);
        } else if(file.isStream()) {
            callback(new PluginError('gulp-strip-debug', 'Streaming not supported'));
            return;
        }
        callback();
    });
};
module.exports = gulpTransform;
module.exports.gulp = gulpTransform;
module.exports.removeExpressionIf  = removeExpressionIf;
module.exports.isCallToMethodIn = isCallToMethodIn;
module.exports.voidExpression = voidExpression;
