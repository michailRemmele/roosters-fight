import { Component } from 'remiz';

export class Health extends Component {
  constructor(componentName, config) {
    super(componentName, config);

    this._points = config.points;
  }

  set points(points) {
    this._points = points;
  }

  get points() {
    return this._points;
  }

  clone() {
    return new Health(this.componentName, {
      points: this.points,
    });
  }
}
