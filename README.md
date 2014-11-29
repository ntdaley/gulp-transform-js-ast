gulp-transform-js-ast
=====================
Gulp plugin to transform javascript files by modifying AST nodes with a visitor

Makes use of [recast](https://www.npmjs.org/package/recast) to parse the javascript into an AST, to run a visitor over the AST to modify nodes, and serialise it back to text.

Install
=======
```npm install --save gulp-transform-js-ast```

Usage
=====
```
var transform = require('gulp-transform-js-ast');
gulp.task('strip-console', function() {
    return gulp.src(['./example.js'])
        .pipe(transform({
            //visit functions as used by recast.visit()
            visitCallExpression : function(path) {
                if( shouldRemove(path) ) {
                    //replace with a (void 0) expression.
                    return transform.voidExpression;
                } else {
                    //don't change it.
                    return path.value;
                }
            }
        }))
        .pipe(gulp.dest('build'));
});
```
or with creation of a sourcemap:
```
var transform = require('gulp-transform-js-ast');
var sourcemaps = require('gulp-sourcemaps');
gulp.task('strip-console', function() {
    return gulp.src(['./example.js'])
        .pipe(sourcemaps.init())
        .pipe(transform({
            //visit functions as used by recast.visit()
            visitCallExpression : function(path) {
                if( shouldRemove(path) ) {
                    //replace with a (void 0) expression.
                    return transform.voidExpression;
                } else {
                    //don't change it.
                    return path.value;
                }
            }
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('build'));
});
```

License
=======
Apache 2.0 License
&copy; Nicholas Daley
