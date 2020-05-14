var html = '',
    newjson = {};


// contenteditable的监听
var duplexContenteditable = new function() {
    var useDOMCharacterDataModified = false,
        target
    if (document.attachEvent && document.addEventListener) {
        document.attachEvent("onselectionchange", function() {
            if (target && target.duplexCallback) {
                target.duplexCallback()
            }
        })
    }
    if ("MutationEvent" in window) {
        var test = document.createElement("div")
        var root = document.body || document.documentElement
        root.appendChild(test)
        test.addEventListener("DOMCharacterDataModified", function(e) {
            useDOMCharacterDataModified = true
        })
        try {
            var event = document.createEvent("MutationEvents");
            event.initMutationEvent("DOMCharacterDataModified", true, false, null, "x", "y", null, 0);
            test.dispatchEvent(event)
        } catch (e) {
            console.log(e);
        }
        setTimeout(function() {
            root.removeChild(test)
        })
    }
    return function(element, callback) {
        function cb(e) {
            var curValue = element.innerHTML
            if (curValue !== oldValue) {
                oldValue = curValue
                callback.call(element)
            }
        }

        if (element.addEventListener) {
            if (useDOMCharacterDataModified) { //基本上所有浏览器都支持

                if ("WebkitAppearance" in root.style) {
                    element.addEventListener("webkitEditableContentChanged", cb)
                } else {
                    element.addEventListener("keyup", cb)
                }
                //DOMCharacterDataModified不能监听第一次变动, 需要使用keyup辅助
                element.addEventListener("DOMCharacterDataModified", cb)
            } else {
                element.addEventListener("input", cb)
            }
        } else {
            var oldValue = NaN
            element.attachEvent("onfocus", function(e) {
                target = element
            })
            element.attachEvent("onblur", function(e) {
                target = null
                oldValue = NaN
            })

            element.duplexCallback = cb
            element.attachEvent("onkeyup", cb)
        }

    }
}

// 渲染树
function render(json) {
    html += `<div data-id='${json.id}'>${json.name}`;
    if (json.children.length) {
        html += `<section>`;
        for (var i = 0; i < json.children.length; i++) {
            render(json.children[i]);
        }
        html += `</section>`;
    }
    html += `</div>`;
}

//html转sjon
function htmlToJson(node) {
    var _children = [];
    if (node.children.length) {
        if (node.children[0].localName == 'section' && node.localName == 'div') {
            for (var i = 0; i < node.children[0].children.length; i++) {
                _children.push(htmlToJson(node.children[0].children[i]))
            }
        } else {
            for (var i = 0; i < node.children.length; i++) {
                _children.push(htmlToJson(node.children[i]))
            }
        }
    }
    var name = node.innerHTML.match(/^[^<]+/);
    return {
        id: 'node' + (name && name[0]),
        data: {},
        name: name && name[0],
        children: _children
    }
}

//重新绘制html树
function drawTree() {
    $('#infovis').empty();
    init();
}

//生产4位随机数:用于新生产的空标签
function getRandom() {
    return Math.random().toString(36).substr(2, 4);
}

//更新事件触发
$(document).on('click', '.sure', function() {
    //拿到当前htmltojson
    json = (htmlToJson(document.querySelector('#box'))).children[0];
    drawTree();
})


// 重写键盘事件 KeyDown、KeyPress、KeyUp
$(document).keydown(function(event) {
    // 操作规则:
    // tab操作
    //   单个dom:变成子节点，只能比上一级多一层
    //   多个dom:整个移动
    // shift+tab操作
    //   单个dom:层级提一层，最大只能到外层
    //   多个dom:整个移动
    // enter操作
    //   尾部:有孩子，插孩子，没孩子，下插兄弟
    //   首部:暂时不处理
    //   中部:暂时不处理
    // 光标处理

    // ---------------以下目前没开发---------------
    // del操作
    //   光标在首部:
    //     内部有文字 不起作用
    //     内部无文字 删除该行
    // 其他按键操作


    // 用户按下了tab+shift
    if (event.keyCode == 9 && event.shiftKey) {
        // console.log('用户按下了tab+shift');
        event.preventDefault();
        var _range = getCurrentRange(),
            _dataId = _range.commonAncestorContainer.parentNode.dataset.id,
            node = $('#box').find('[data-id=' + _dataId + ']'), //当前节点
            nodeParent = node.parent();//父节点
            nodeGrandfather=nodeParent.parent().parent();//太爷爷节点

        if (nodeParent.length && nodeGrandfather.attr('id') != 'box') {
            var _htmlClone = node[0].outerHTML;
            $(node.parents()[1]).after(_htmlClone);
            if (!node.siblings().length) {
                node.parent().remove();
            } else {
                node.remove();
            }
            var _len=$('[data-id='+_dataId+']').html().match(/^[^<]+/)[0].length;
            setCaretPosition($('[data-id='+_dataId+']')[0],_len);
        } else {
            return false;
        }
    }

    //用户按下了tab
    if (event.keyCode == 9 && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        console.log('用户仅按了tab');
        event.preventDefault();
        var _range = getCurrentRange(),
            _dataId = _range.commonAncestorContainer.parentNode.dataset.id,
            node = $('#box').find('[data-id=' + _dataId + ']'), //当前节点
            prevNode = node.prev(), //前兄弟节点
            hasChild = node.children().length ? true : false; //当前节点是否有孩子
            prevNodeLevel = prevNode.find('section').length; //前兄弟节点深度

        //多个dom tab操作

        // 是否有兄弟节点
        if (node.siblings().length) {
            // 前节点是否存在
            if (prevNode.length) {
                var _htmlClone = node[0].outerHTML;
                node.remove();
                // 前节点是否有孩子
                if (prevNode.children().length) {
                    prevNode.children().append(_htmlClone);
                    var _len = $('[data-id=' + _dataId + ']').html().match(/^[^<]+/)[0].length;
                    setCaretPosition($('[data-id=' + _dataId + ']')[0], _len);
                } else {
                    prevNode.append('<section>' + _htmlClone + '</section>');
                    var _singleLength=$(_htmlClone).html().match(/^[^<]+/)[0].length,
                        _singleId=$(_htmlClone).data().id;
                    setCaretPosition($('[data-id=' + _singleId + ']')[0], _singleLength);
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    //用户按了回车
    if (event.keyCode == 13 && !event.ctrlKey && !event.altKeyKey && !event.shiftKey) {
        // console.log('用户仅按了回车');
        var _range = getCurrentRange(),
            // dataid取值问题
            //   div中有内容: _range.commonAncestorContainer.parentNode.dataset.id
            //   div中无内容: _range.commonAncestorContainer.dataset.id
            _dataId = _range.commonAncestorContainer.data ? _range.commonAncestorContainer.parentNode.dataset.id : _range.commonAncestorContainer.dataset.id,
            node = $('#box').find('[data-id=' + _dataId + ']'), //当前节点
            hasChild = node.children().length ? true : false; //当前节点是否有孩子

        if (hasChild) {
            // 有孩子，回车事件处理
            event.preventDefault();
            var random = getRandom();
            node.find('section').prepend('<div data-id=node_' + random + '></div>');
            setCaretPosition($('[data-id=node_' + random + ']')[0], 0)
        } else {
            // 无孩子，回车事件处理
            event.preventDefault();
            var random = getRandom();
            $(node).after('<div data-id=node_' + random + '></div>');
            setCaretPosition($('[data-id=node_' + random + ']')[0], 0)
        }
    }

});

// getSelection、createRange兼容
function isSupportRange() {
    return typeof document.createRange === 'function' || typeof window.getSelection === 'function'
}

//设置光标位置
const setCaretPosition = function(element, pos) {
    var range, selection;
    if (document.createRange) //Firefox, Chrome, Opera, Safari, IE 9+
    {
        range = document.createRange(); //创建一个选中区域
        range.selectNodeContents(element); //选中节点的内容
        if (element.innerHTML.length > 0) {
            range.setStart(element.childNodes[0], pos); //设置光标起始为指定位置
        }
        range.collapse(true); //设置选中区域为一个点
        selection = window.getSelection(); //获取当前选中区域
        selection.removeAllRanges(); //移出所有的选中范围
        selection.addRange(range); //添加新建的范围
    } else if (document.selection) //IE 8 and lower
    {
        range = document.body.createTextRange(); //Create a range (a range is a like the selection but invisible)
        range.moveToElementText(element); //Select the entire contents of the element with the range
        range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
        range.select(); //Select the range (make it the visible selection
    }
}

// 获取光标位置 返回range0
function getCurrentRange() {
    let range = null
    let selection = null
    if (isSupportRange) {
        // selection API https://developer.mozilla.org/en-US/docs/Web/API/Selection
        selection = document.getSelection()
        if (selection.getRangeAt && selection.rangeCount) {
            // range API
            // https://developer.mozilla.org/en-US/docs/Web/API/Range
            // https://blog.csdn.net/mafan121/article/details/78519348
            range = document.getSelection().getRangeAt(0)
        }
    } else {
        range = document.selection.createRange()
    }
    return range
}


window.onload = function() {
    render(json);
    setTimeout(function() {
        $('#box').append(html);
    }, 100);
    init();
    duplexContenteditable(box, function() {
        newjson = htmlToJson(this);
    })
}
