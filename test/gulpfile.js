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
var gulp = require('gulp');
var transform = require('../index');
var sourcemaps = require('gulp-sourcemaps');
var ngAnnotate = require('gulp-ng-annotate');

gulp.task('without-sourcemaps', function() {
     return gulp.src(['./example.js'])
        .pipe(transform({
            visitCallExpression : transform.removeExpressionIf(transform.isCallToMethodIn('$log'))
        }))
        .pipe(gulp.dest('build'));
});
gulp.task('with-input-sourcemap', function() {
    return gulp.src(['./example.js'])
        .pipe(sourcemaps.init())
        .pipe(ngAnnotate())
        .pipe(transform({
            visitCallExpression : transform.removeExpressionIf(transform.isCallToMethodIn('$log'))
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('build'));
});
gulp.task('without-input-sourcemap', function() {
    return gulp.src(['./example.js'])
        .pipe(sourcemaps.init())
        .pipe(transform({
            visitCallExpression : transform.removeExpressionIf(transform.isCallToMethodIn('$log'))
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('build'));
});
gulp.task('default', ['with-input-sourcemap']);
