declare module 'plotly.js-dist-min' {
  namespace Plotly {
    interface Layout {
      title?: string;
      xaxis?: any;
      yaxis?: any;
      hovermode?: string;
      margin?: any;
      height?: number;
      [key: string]: any;
    }

    interface Data {
      x?: any;
      y?: any;
      name?: string;
      type?: string;
      mode?: string;
      line?: any;
      [key: string]: any;
    }

    function newPlot(
      div: string | HTMLElement,
      data: Data[],
      layout?: Partial<Layout>,
      config?: any
    ): Promise<HTMLElement>;
  }

  export default Plotly;
}
