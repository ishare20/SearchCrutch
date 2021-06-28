/* exported $ isEmpty insertCustomArray inHostArray GetUrlParms getSearch dataBackup dataRecover */
function $(objStr) { return document.getElementById(objStr); }
// Avoid 'chrome' namespace
var isChrome = false; //On Chrome
if (typeof browser === "undefined" && typeof chrome === "object") {
    var browser = chrome; //On Chrome
    isChrome = true;
}
var search_custom_num = 15;
var search_array = ["google", "baidu", "bing", "sogou"];

var searchselect_array =
    [
        ["Google", "https://www.google.com/search?q=", "q", "https://www.google.com"],
        ["百度", "https://www.baidu.com/s?wd=", "wd", "https://www.baidu.com"],
        ["必应", "https://cn.bing.com/search?q=", "q", "https://cn.bing.com"],
        ["搜狗", "https://www.sogou.com/web?query=", "query", "https://www.sogou.com"],

    ];
var searchhost_array =
    [
        ["www.google.com", 0],
        ["www.baidu.com", 1],
        ["cn.bing.com", 2],
        ["www.sogou.com", 3]

    ];
var arr
createMenu()


chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    if (request.ask === 'reload') {
        createMenu()
    }
})

function createMenu() {
    //创建右键菜单
    chrome.contextMenus.removeAll()

    arr = new Map()

    
    for (i = 0; i < 4; i++) {
        var cb_id = "cb_" + i;
        if (localStorage[cb_id] == 'checked') {
            var setting = {
                title: searchselect_array[i][0],
                contexts: ["selection"],
                onclick: searchClick,
            }
            var id = chrome.contextMenus.create(setting)
            //arr.push(id)
            arr.set(id, i)
        }
    }
   
     for (i = 4; i < search_custom_num+4; i++) {
            var cb_id = "cb_" + i;
            var cb_name = 'custom_name_' + (i - 4)
            if (localStorage[cb_id] == 'checked') {
                var setting = {
                    title: localStorage[cb_name],
                    contexts: ["selection"],
                    onclick: searchClick
                }
                var cid = chrome.contextMenus.create(setting)
                //arr.push(cid)
                arr.set(cid, i)
            }

        }

        //console.log(searchselect_array)

}

function searchClick(info, tab) {
    var itemId = info.menuItemId
    var keyword = info.selectionText
    //console.log('itemId:' + itemId)
    //console.log('arr idx:' + arr.get(itemId))
    //console.log('url:' + searchselect_array[arr.get(itemId)][1])

    var searchUrl = searchselect_array[arr.get(itemId)][1]
    searchUrl = searchUrl.replace(/%s/i, '') + encodeURIComponent(keyword)
    //console.log('searchUrl:' + searchUrl)
    chrome.tabs.create({ url: searchUrl });
    // window.open(searchUrl)
}





function isEmpty(obj) {
    for (var name in obj) {
        return false;
    }
    return true;
}
function insertCustomArray() {
    if (null == localStorage.getItem("custom_search_0"))
        return;
    var i;
    for (i = search_array.length; i > 4; i--) {  // 判断是否需要删除尾部追加的自定义搜索
        search_array.pop();
        searchhost_array.pop();
        searchselect_array.pop();
    }
    for (i = 0; i < search_custom_num; i++) {
        var custom_name_id = "custom_name_" + i;
        var custom_search_id = "custom_search_" + i;
        var insert_array = "custom_" + i;
        var custom_name = localStorage[custom_name_id];
        var custom_search = localStorage[custom_search_id];
        search_array.push(insert_array);
        insert_array = [GetHost(custom_search), 4 + i];
        searchhost_array.push(insert_array);
        var qstr_array = "q";
        var regexp = /[#?&]\w{1,7}=$|[#?&]\w{1,7}=&/g;  // q=    search=    keyword=
        if (custom_search.toLowerCase().match("%s")) {
            qstr_array = "%s";
        } else {
            qstr_array = custom_search.toLowerCase().match(regexp);
            if (qstr_array != null) {
                qstr_array = qstr_array[qstr_array.length - 1];
                qstr_array = qstr_array.substr(1, qstr_array.length - 2);
            } else {
                qstr_array = "q";
            }
        }
        insert_array = [custom_name, custom_search, qstr_array, "https://" + GetHost(custom_search)];
        searchselect_array.push(insert_array);


    }

}
function inHostArray(host) {
    for (var i = 0; i < searchhost_array.length; i++) {
        if (host.match(searchhost_array[i][0]) != null)
            return i;
    }
    return -1;
}
function GetUrlParms(hrefstr) {
    var args = new Object();
    hrefstr = decodeURI(hrefstr);
    //针对Google的情况，防止关键字分错，https://www.google.co.uk/?gws_rd=ssl#q=dd    https://www.google.co.jp/?gws_rd=ssl,cr#q=dd
    hrefstr = hrefstr.replace(/\?gws_rd=([^#?&]+)/, "");
    //针对Google的情况 https://ipv4.google.com/sorry/index?continue=https://www.google.com/search%3Fq%3Ddd    //https://ipv4.google.com/sorry/IndexRedirect?continue=https://www.google.com/search%3Fq%3Ddd
    if (hrefstr.match("//ipv4.google.com/") != null) {
        hrefstr = hrefstr.replace(/^https?:\/\/ipv4\.google\.com\/sorry\/([a-zA-Z0-9]+)\?continue=/, "");
        hrefstr = unescape(hrefstr);
    } else if (hrefstr.match("//www.soku.com/search_video/q_") != null) { //针对Soku的情况 http://www.soku.com/search_video/q_dd 替换 q_ 为 ?q=
        var end = hrefstr.indexOf("?");
        if (end > 0)
            hrefstr = hrefstr.substring(0, end);    // 移除?之后的内容 http://www.soku.com/search_video/q_dd?f=1
        hrefstr = hrefstr.replace(/^https?:\/\/www\.soku\.com\/search_video\/q_/, "http://www.soku.com/search_video/?q=");
    } else if (hrefstr.match("//s.weibo.com/weibo/") != null) { //针对微博搜索的情况 http://s.weibo.com/weibo/dd 添加 ?q=
        hrefstr = hrefstr.replace(/^https?:\/\/s\.weibo\.com\/weibo\//, "http://s.weibo.com/weibo/?q=");
    } else if (hrefstr.match("//s.weibo.com/user/") != null) {  //针对微博搜索的情况 http://s.weibo.com/user/dd 添加 ?q=
        hrefstr = hrefstr.replace(/^https?:\/\/s\.weibo\.com\/user\//, "http://s.weibo.com/user/?q=");
    } else if (hrefstr.match("//www.acfun.cn/search/") != null) {  //针对AcFun搜索的情况 http://www.acfun.cn/search/?#page=1;query=dd;type=video 替换 query 之前的内容为 ?query
        hrefstr = hrefstr.replace(/^https?:\/\/www\.acfun\.cn\/search\/(.+)query=/, "http://www.acfun.cn/search/?query=");
        hrefstr = hrefstr.replace(";", "&");
    }
    var pos = hrefstr.indexOf("?");
    if (0 > pos)
        pos = hrefstr.indexOf("#");//针对Google的情况，没找到时重找一次： https://www.google.com.hk/#q=dd
    if (0 > pos)
        pos = hrefstr.indexOf("&");//针对Google出错时的情况，寻找关键字： https://www.google.com.hk/search&q=dd
    if (0 < pos) {
        var query = hrefstr.substring(pos + 1);
        var pairs = query.split("&");//在逗号处断开   
        for (var i = 0; i < pairs.length; i++) {
            pos = pairs[i].indexOf("=");//查找name=value   
            if (pos == -1) continue;//如果没有找到就跳过   
            var argname = pairs[i].substring(0, pos);//提取name   
            var value = pairs[i].substring(pos + 1);//提取value   
            if (typeof args[argname] == "undefined") { //只保留第一次找到的
                args[argname] = value;//存为属性 
            }
        }
    }
    return args;
}
function GetHost(url) {
    var pos = url.indexOf("//");
    var host;
    if (-1 < pos)
        host = url.substr(pos + 2);
    else
        return "";
    if (host.length > 0) {
        pos = host.indexOf("/");
        if (-1 < pos)
            host = host.substr(0, pos);
    }
    return host.toLowerCase();
}
function getSearch(host) {
    if (host) {
        for (var i = 0; i < search_array.length; i++) {
            if (-1 < host.indexOf(search_array[i]))
                return search_array[i];
        }
    }
}
function dataBackup() {
    var data = new Object();
    for (var i = 0; i < searchselect_array.length + search_custom_num; i++) {
        var cb_id = "cb_" + i;
        data[cb_id] = localStorage[cb_id];
    }
    for (i = 0; i < search_custom_num; i++) {
        var custom_name_id = "custom_name_" + i;
        var custom_search_id = "custom_search_" + i;
        data[custom_name_id] = localStorage[custom_name_id];
        data[custom_search_id] = localStorage[custom_search_id];
    }
    data["cb_switch"] = localStorage["cb_switch"];
    data["cb_autosync"] = localStorage["cb_autosync"];
    data["backup_data"] = true;
    if (isChrome) {
        browser.storage.sync.clear(function () {
            browser.storage.sync.set(data, function () { });
        });
    } else {
        browser.storage.local.clear().then(() => {
            browser.storage.sync.set(data);
        }, null);
    }
}
function dataRecover() {
    for (var i = 0; i < search_array.length + search_custom_num; i++) {
        var cb_id = "cb_" + i;
        if (isChrome) {
            browser.storage.sync.get(cb_id, function (item) {
                for (var key in item) break;    //取第一个
                localStorage[key] = item[key];
            });
        } else {
            browser.storage.sync.get(cb_id).then((item) => {
                for (var key in item) break;    //取第一个
                localStorage[key] = item[key];
            }, null);
        }
    }
    for (i = 0; i < search_custom_num; i++) {
        var custom_name_id = "custom_name_" + i;
        var custom_search_id = "custom_search_" + i;
        if (isChrome) {
            browser.storage.sync.get(custom_name_id, function (item) {
                for (var key in item) break;
                localStorage[key] = item[key];
            });
            browser.storage.sync.get(custom_search_id, function (item) {
                for (var key in item) break;
                localStorage[key] = item[key];
            });
        } else {
            browser.storage.sync.get(custom_name_id).then((item) => {
                for (var key in item) break;
                localStorage[key] = item[key];
            }, null);
            browser.storage.sync.get(custom_search_id).then((item) => {
                for (var key in item) break;
                localStorage[key] = item[key];
            }, null);
        }
    }
    if (isChrome) {
        browser.storage.sync.get("cb_switch", function (item) {
            localStorage["cb_switch"] = item.cb_switch;
        });
        browser.storage.sync.get("cb_autosync", function (item) {
            localStorage["cb_autosync"] = item.cb_autosync;
        });
    } else {
        browser.storage.sync.get("cb_switch").then((item) => {
            localStorage["cb_switch"] = item.cb_switch;
        }, null);
        browser.storage.sync.get("cb_autosync").then((item) => {
            localStorage["cb_autosync"] = item.cb_autosync;
        }, null);
    }
}
