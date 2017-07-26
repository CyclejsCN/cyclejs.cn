'use strict';
var fs = require('fs');
var ejs = require('ejs');

var template = ejs.compile(fs.readFileSync(__dirname + '/template.html', 'utf-8'));

var chapters = [
  {id: 'getting-started', title: '起步'},
  {id: 'dialogue', title: '对话抽象'},
  {id: 'streams', title: '流'},
  {id: 'basic-examples', title: '基本例子'},
  {id: 'model-view-intent', title: 'model-view-intent'},
  {id: 'components', title: '组件'},
  {id: 'drivers', title: 'Drivers'},
]

chapters.forEach(function (chapter, i) {
  var mdFilename = __dirname + '/../content/documentation/' + chapter.id + '.md';
  var htmlFilename = __dirname + '/../' + chapter.id + '.html';
  var content = fs.readFileSync(mdFilename, 'utf-8');
  var menuItems = chapters.map(c => ({link: c.id + '.html', title: c.title}));
  var premenu = menuItems.filter((c, j) => j < i);
  var postmenu = menuItems.filter((c, j) => j > i);
  var outputStr = template({
    title: chapter.title,
    pathToRoot: '',
    content: content,
    premenu: premenu,
    postmenu: postmenu,
  });
  fs.writeFileSync(htmlFilename, outputStr, 'utf-8');
});
