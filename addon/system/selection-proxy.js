
import Ember from 'ember';
import d3 from 'd3';

import { assign } from '../utils/d3';

var SelectionProxy = Ember.Object.extend({
  unknownProperty(key) {
    return SelectionProxy.proxyElement(this, 'g', key);
  },

  transition(options) {
    var ret = TransitionSelectionProxy.create({});

    ret._selection = this.get('selection');
    ret._options = options;

    return ret;
  },

  call(component) {
    return component.get('call').call(component, this.get('selection'));
  },

  toString() {
    var guid = Ember.guidFor(this);
    var node = (this.get('_selection') || this.get('selection')).node();
    var tagName = node.tagName;
    var id = node.id ? `#${node.id}` : '';
    var cls = node.classList[0] ? `.${node.classList[0]}` : '';

    return `<ember-cli-d3@selection-proxy:${guid}::${tagName}${id}${cls}>`;
  }
});

SelectionProxy.reopenClass({
  proxyElement(proxy, tagName, className) {
    var selection = proxy.get('selection');
    var proxied = selection.select(`${tagName}.${className}`);

    if (proxied.empty()) {
      proxied = selection.append(tagName).classed(className, true);
    }

    return SelectionProxy.create({ selection: proxied });
  }
});

var TransitionSelectionProxy = SelectionProxy.extend({
  _selection: null,
  _options: null,

  selection: Ember.computed(function () {
    return assign(this._selection.transition(), this._options);
  }).volatile()

});

export default Ember.Object.extend({
  container: null,

  select: Ember.computed('element', function () {
    return SelectionProxy.create({
      selection: d3.select(this.get('element'))
    });
  }).readOnly(),
  defs: Ember.computed('element', function () {
    var element = this.get('element');
    var node = element.firstChild;

    Ember.assert('selection-proxy#defs shouldnt be called second time', node.nodeType === Node.COMMENT_NODE && node.textContent === 'defs');

    var defs = document.createElementNS(d3.ns.prefix.svg, 'defs');

    element.replaceChild(defs, node);

    return SelectionProxy.create({
      selection: d3.select(defs)
    });
  }).readOnly(),

  init() {
    this._super(...arguments);

    this.set('container', document.createDocumentFragment());
  },

  swapContainer() {
    console.log('swap');
    var fragment = this.get('container');
    var svg = this.get('element').querySelector('svg');

    svg.appendChild(fragment);

    Ember.run.schedule('sync', () => {
      this.set('container', svg);
      this.set('select.selection', d3.select(svg));
    });
  }
});
