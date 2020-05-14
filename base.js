var labelType, useGradients, nativeTextSupport, animate, st;
//init data
var json = {
    id: "node02",
    name: "前端",
    data: {},
    children: [
        {
          id: "node165",
          name: "1.65",
          data: {},
          children: [
            {
              id: "node2109",
              name: "2.109",
              data: {},
              children: [
                {
                    id: "node111",
                    name: "1.11",
                    data: {},
                    children: [
                      {
                          id: "node222",
                          name: "2.22",
                          data: {},
                          children: []
                      },
                      {
                          id: "node333",
                          name: "3.33",
                          data: {},
                          children: []
                      }
                    ]
                }
              ]
          }
        ]
      },
      {
          id: "node1130",
          name: "1.130",
          data: {},
          children: [
            {
              id: "node2131",
              name: "2.131",
              data: {},
              children: []
            },
            {
              id: "node21322",
              name: "2.1322",
              data: {},
              children: []
            }
        ]
      },
      {
          id: "node1qwe",
          name: "1qwe",
          data: {},
          children: [
            {
              id: "node2wed",
              name: "2wed",
              data: {},
              children: []
            },
            {
              id: "node2rvb",
              name: "2rvb",
              data: {},
              children: []
            }
        ]
      }
  ]
};


(function() {
    var ua = navigator.userAgent,
        iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
        typeOfCanvas = typeof HTMLCanvasElement,
        nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
        textSupport = nativeCanvasSupport &&
        (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
    //I'm setting this based on the fact that ExCanvas provides text support for IE
    //and that as of today iPhone/iPad current text support is lame
    labelType = (!nativeCanvasSupport || (textSupport && !iStuff)) ? 'Native' : 'HTML';
    nativeTextSupport = labelType == 'Native';
    useGradients = nativeCanvasSupport;
    animate = !(iStuff || !nativeCanvasSupport);
})();

var Log = {
    elem: false,
    write: function(text) {
        if (!this.elem)
            this.elem = document.getElementById('log');
        this.elem.innerHTML = text;
        this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
    }
};


function init() {
    //preprocess subtrees orientation
    var arr = json.children,
        len = arr.length;
    for (var i = 0; i < len; i++) {
        //split half left orientation
        if (i < len / 2) {
            arr[i].data.$orn = 'left';
            $jit.json.each(arr[i], function(n) {
                n.data.$orn = 'left';
            });
        } else {
            //half right
            arr[i].data.$orn = 'right';
            $jit.json.each(arr[i], function(n) {
                n.data.$orn = 'right';
            });
        }
    }
    //end
    //grab radio button
    // var normal = $jit.id('s-normal');
    //init Spacetree
    //Create a new ST instance

    // API配置:
    //    http://philogb.github.io/jit/static/v20/Docs/files/Visualizations/Spacetree-js.html
     st = new $jit.ST({
        injectInto: 'infovis',
        multitree: true,
        duration: 800,
        levelsToShow:10,
        transition: $jit.Trans.Quart.easeInOut,
        levelDistance: 40,
        siblingOffset: 3,
        subtreeOffset: 3,
        Navigation: {
          enable:true,
          panning:true,
          zooming:true
        },
        Node: {
            autoHeight: true,
            autoWidth: true,
            type: 'rectangle',//circle,rectangle,square,ellipse,triangle,star
            // color: 'rgb(54,58,59)',
            color: '#fff',
            overridable: true,
            angularWidth:10,
            CanvasStyles: {
                //参考Context2D的方法 https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/shadowColor
                shadowColor: 'rgb(175,182,186)',//'#ccc'
                shadowBlur: 10,
                textAlign:'middle',
                textBaseline:'middle',
                lineJoin:'miter',//bevel round miter
                lineDashOffset:3,
                lineCap:'square',//butt round square
                font : "48px serif",
                fillStyle:'rgb(255,255,255)',
            }
        },
        NodeStyles:{
           enable:true,
          //  stylesHover: {
          //   color: 'red'
          // },
          // duration: 500
        },
        Edge: {
            type: 'line',
            overridable: true
        },
        Events:{
          enable:false,
        },
        Tips:{
          enable: true,
          offsetX: 10,
          offsetY: 10,
          onShow: function(tip, node) {
            tip.innerHTML = node.name;
          }
        },
        onBeforeCompute: function(node) {
            Log.write("loading " + node.name);
        },

        onAfterCompute: function() {
            Log.write("done");
        },

        //This method is called on DOM label creation.
        //Use this method to add event handlers and styles to
        //your node.
        onCreateLabel: function(label, node) {
            label.id = node.id;
            label.innerHTML = node.name;
            // label.onclick = function() {
                // 2种切换方式
                // if (normal.checked) {
                // st.onClick(node.id);
                // } else {
                //     st.setRoot(node.id, 'animate');
                // }
            // };
            //set label styles
            var style = label.style;
            style.width = 50 + 'px';
            style.height = 35 + 'px';
            style.cursor = 'pointer';
            style.color = '#333';
            style.fontSize = '0.8em';
            style.textAlign = 'center';
            style.paddingTop = '10px';
        },

        //This method is called right before plotting
        //a node. It's useful for changing an individual node
        //style properties before plotting it.
        //The data properties prefixed with a dollar
        //sign will override the global node style properties.
        onBeforePlotNode: function(node) {
            //add some color to the nodes in the path between the
            //root node and the selected node.
            if (node.selected) {
                node.data.$color = "#ff7";
            } else {
                delete node.data.$color;
                //if the node belongs to the last plotted level
                if (!node.anySubnode("exist")) {
                    //count children number
                    var count = 0;
                    node.eachSubnode(function(n) {
                        count++;
                    });
                    //assign a node color based on
                    //how many children it has
                    node.data.$color = ['#aaa', '#baa', '#caa', '#daa', '#eaa', '#faa'][count];
                }
            }
        },

        //This method is called right before plotting
        //an edge. It's useful for changing an individual edge
        //style properties before plotting it.
        //Edge data proprties prefixed with a dollar sign will
        //override the Edge global style properties.
        onBeforePlotLine: function(adj) {
            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                adj.data.$color = "#eed";
                adj.data.$lineWidth = 3;
            } else {
                delete adj.data.$color;
                delete adj.data.$lineWidth;
            }
        }
    });
    //load json data
    st.loadJSON(json);
    //compute node positions and layout
    st.compute('end');
    st.select(st.root);
    //end
}
