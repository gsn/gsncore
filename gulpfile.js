var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var exec = require('child_process').exec;
var sourcemaps = require('gulp-sourcemaps');

var pkg = require('./package.json');
var banner = [
  '/*!',
  ' * <%= pkg.name %>',
  ' * version <%= pkg.version %>',
  ' * <%= pkg.description %>',
  ' * Build date: <%= new Date() %>',
  ' */\n'
].join('\n');
var allSources = ['src/gsn.js', 'src/module.js', 'src/gsn-ui-map.js', 'src/angular-recaptcha.js', 'vendor/*.js', 'src/services/*.js', 'src/filters/*.js', 'src/directives/*.js'];
var t = {
  build: () => {
    return gulp.src(allSources)
      .pipe($.concat('gsncore.js'))
      .pipe($.header(banner, {
        pkg: pkg
      }))
      .pipe(gulp.dest('.'));
  },
  bump: () => {
    return gulp.src(['package.json'])
      .pipe($.bump({
        type: 'patch'
      }))
      .pipe(gulp.dest('.'));
  },
  bump_minor: () => {
    return gulp.src(['package.json'])
      .pipe($.bump({
        type: 'minor'
      }))
      .pipe(gulp.dest('.'));
  },
  bump_major: () => {
    return gulp.src(['package.json'])
      .pipe($.bump({
        type: 'major'
      }))
      .pipe(gulp.dest('.'));
  },
  build_basic: () => {
    return gulp.src(['src/gsn.js', 'src/module.js', 'src/gsn-ui-map.js', 'src/angular-recaptcha.js', 'src/filters/*.js', 'src/services/*.js', 'src/directives/ctrlAccount.js', 'src/directives/ctrlChangePassword.js', 'src/directives/ctrlCircular.js', 'src/directives/ctrlContactUs.js', 'src/directives/ctrlEmail.js', 'src/directives/ctrlEmailPreview.js', 'src/directives/ctrlLogin.js', 'src/directives/ctrlPartialContent.js', 'src/directives/ctrlShoppingList.js', 'src/directives/facebook.js', 'src/directives/gsn*.js', 'src/directives/gsnAddHead.js', 'src/directives/placeholder.js', 'vendor/angular-facebook.js', 'vendor/angulartics.min.js', 'vendor/fastclick.js', 'vendor/loading-bar.min.js', 'vendor/ng-infinite-scroll.min.js', 'vendor/ui-utils.min.js'])
      .pipe($.concat('gsncore-basic.js'))
      .pipe($.header(banner, {
        pkg: pkg
      }))
      .pipe(gulp.dest('.'));
  }
}

const defaultTasks = gulp.series(t.build, t.build_basic, () => {
  gulp.src('./gsncore-basic.js')
    .pipe(sourcemaps.init())
    .pipe($.uglify({
      output: {
        comments: /^!/
      }
    }))
    .pipe($.rename({
      suffix: '.min'
    }))
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest('.'));

  return gulp.src('./gsncore.js')
    .pipe(sourcemaps.init())
    .pipe($.uglify({
      output: {
        comments: /^!/
      }
    }))
    .pipe($.rename({
      suffix: '.min'
    }))
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest('.'));
});

gulp.task('bump', t.bump);
gulp.task('bump:minor', t.bump_minor);
gulp.task('bump:major', t.bump_major);
gulp.task('build', t.build);
gulp.task('build:basic', t.build_basic);
gulp.task('default', defaultTasks);
