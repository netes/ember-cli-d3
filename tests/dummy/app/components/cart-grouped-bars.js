import Ember from 'ember';
import d3 from 'd3';
import hbs from 'htmlbars-inline-precompile';

import GraphicSupport from 'ember-cli-d3/mixins/d3-support';
import MarginConvention from 'ember-cli-d3/mixins/margin-convention';

import { join, translateX } from 'ember-cli-d3/utils/d3';
import { computed } from 'ember-cli-d3/utils/version';

export default Ember.Component.extend(GraphicSupport, MarginConvention, {
  requiredProperties: [ 'model' ],
  layout: hbs`
    {{#if model}}
      {{yield seriesSel xScale yScale contentWidth contentHeight}}
    {{/if}}
  `,

  model: null,

  stroke: d3.scale.category10(),

  defaultMargin: 60,
  orient: null, // TODO

  width: 300,
  height: 150,

  xScale: computed('contentWidth', 'model.{data,key}', function () {
    var width = this.get('contentWidth');
    var data = this.get('model.data');
    var key = this.get('model.key');

    return d3.scale.ordinal()
      .domain(!key ? data : data.map((data) => Ember.get(data, key)))
      .rangeBands([ 0, width ], 0.5);
  }).readOnly(),
  yScale: computed('contentHeight', 'model.extent', function () {
    var height = this.get('contentHeight');
    var extent = this.get('model.extent');

    extent[0] = Math.min(extent[0], 0);
    extent[1] = Math.max(extent[1], 0);

    if (extent[0] === extent[1]) {
      extent[1]++;
    }

    return d3.scale.linear()
      .domain(extent)
      .range([ 0, -height ]);
  }).readOnly(),
  zScale: computed('xScale', 'model.series', function () {
    var series = this.get('model.series');
    var band = this.get('xScale').rangeBand();

    return d3.scale.ordinal()
      .domain(series)
      .rangePoints([ 0, band ], 1);
  }).readOnly(),

  call(selection) {
    var context = this;
    var top = this.get('margin.top');
    var left = this.get('margin.left');
    var height = this.get('contentHeight');
    var elementId = context.elementId;

    selection.each(function () {
      context.series(d3.select(this).attr('id', elementId).attr('transform', `translate(${left} ${top + height})`));
    });
  },

  series: join('model.series', '.series', {
    enter(selection) {
      var context = this;
      var color = this.get('stroke');
      var zScale = this.get('zScale');

      selection.append('g')
          .style('stroke', color)
          .attr('class', 'series')
          .attr('transform', (series) => `translate(${zScale(series)} 0)`)
        .each(function (data) {
          context.bars(d3.select(this), data);
        });
    },

    update(selection) {
      var context = this;
      var color = this.get('stroke');
      var zScale = this.get('zScale');

      d3.transition(selection).attr('transform', (series) => `translate(${zScale(series)} 0)`)
        .style('stroke', (series) => color(series))
        .each(function (data) {
          context.bars(d3.select(this), data);
        });
    }

  }),

  bars: join('model.data[model.key]', '.bar', {
    enter(selection) {
      var xScale = this.get('xScale');
      var yScale = this.get('yScale');
      var key = this.get('model.key');
      var zero = yScale(0);

      selection
        .append('g')
          .attr('class', 'bar')
          .attr('transform', translateX(data => xScale(Ember.get(data, key))))
        .append('line')
          .attr('class', 'shape')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', zero)
          .attr('y2', zero);
    },
    update(selection, series) {
      var xScale = this.get('xScale');
      var yScale = this.get('yScale');
      var zero = yScale(0);
      var key = this.get('model.key');

      d3.transition(selection)
          .attr('transform', translateX(data => xScale(Ember.get(data, key))))
        .select('.shape')
          .style('marker-start', null)
          .style('marker-mid', null)
          .style('marker-end', null)
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', zero)
          .attr('y2', data => yScale(data[series]));
    }
  })
});
