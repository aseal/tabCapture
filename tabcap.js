
// Copyright (c) 2014 Abhijit Seal. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Called when the user clicks on the browser action.
// chrome.browserAction.onClicked.addListener(function(tab) {

document.addEventListener('DOMContentLoaded', onInit, false);

function trimString(str, maxLen) {
	tstr = str.substr(0, maxLen);

	if (tstr.length == maxLen) {
		lspace = tstr.lastIndexOf(" ");
		if (maxLen - lspace < 20) {
			tstr = tstr.substr(0, lspace);
		}
	}
	return tstr;
}

function clearForm() {
	var form = document.getElementById("tabSubmitForm");
	if (form) form.parentNode.removeChild(form);
}

function addBreakLine(form) {
	form.appendChild(document.createElement("br"));
}

function createText(form, id, value, label) {
	var txt = document.createElement("input");
	txt.type = "text";
	txt.value = value;
	txt.id = id;
	txt.size = 50;
	txt.className = "normalText";

	form.appendChild(document.createTextNode(label));
	form.appendChild(txt);
	addBreakLine(form);
}

function createRadio(form, key, value) {
	var radio = document.createElement("input");
	radio.type = "radio";
	radio.name = key;
	radio.value = value;
	radio.id = key;

	var lbl = document.createElement("label");
	lbl.innerText = key;
	lbl.htmlfor = key;

	form.appendChild(radio);
	form.appendChild(lbl);
	addBreakLine(form);
}

function createCheckBox(form, name, value, checked, id, label, className) {
	var cb = document.createElement("input");
	cb.type = "checkbox";
	cb.name = name;
	cb.value = value;
	cb.checked = checked;
	cb.id = id;
	if (className) cb.className = className;

	var lbl = document.createElement("label");
	lbl.htmlFor = cb.id;
	if (className) lbl.className = className;
	lbl.appendChild(document.createTextNode(label));

	form.appendChild(cb);
	form.appendChild(lbl);
	addBreakLine(form);
}

function createDiv(form, id) {
	div = document.createElement("div");
	div.className = id;
	form.appendChild(div);
}

function createButton(form, value, cb) {
	var button = document.createElement("input");
	button.type = "button";
	button.value = value;
	button.onclick = cb;
	form.appendChild(button);
	createDiv(form, "divider");
}

function openTabsCB(e) {

	var el = document.getElementById('tabSubmitForm').elements;

	for (var i = 0; i < el.length; i++) {
		if (el[i].type && el[i].type == "radio" && el[i].checked) {
			console.log(el[i].value);
			var tabVal = JSON.parse(el[i].value);
			for (var i = 0; i < tabVal.length; i++) {
				console.log(tabVal[i].url);
				chrome.tabs.create({ url:tabVal[i].url, active:false});
			}
			break;
		}
	}
	clearForm();
}

function bookmarkTabsCB(e) {
	var tabRecVal = [];
	var tabObj = {};

	var tabRecKey =	document.getElementById('tabRecKey').value;
	var el = document.getElementById('tabSubmitForm').elements;

	console.log(el);

	chrome.bookmarks.create({'parentId': '1',
							 'title': tabRecKey},
							 function(newFolder) {
		
		for (var i = 0; i < el.length; i++) {
			if (el[i].type && el[i].type == "checkbox" && el[i].checked) {
				chrome.bookmarks.create({'parentId': newFolder.id,
								'title': el[i].name,
								'url': el[i].value});
			}
		}
	});

	clearForm();
}

function saveTabsCB(e) {
	var tabRecVal = [];
	var tabObj = {};

	var tabRecKey =	document.getElementById('tabRecKey').value;
	var el = document.getElementById('tabSubmitForm').elements;

	if (tabRecKey.trim() == '') return;
	console.log(el);

	for (var i = 0; i < el.length; i++) {
		if (el[i].type && el[i].type == "checkbox" && el[i].checked)
			tabRecVal.push({title:el[i].name, url:el[i].value});
	}
	tabObj[tabRecKey] = JSON.stringify(tabRecVal);

	chrome.storage.sync.set(tabObj, function() {
			console.log('Tabs saved');
	});
	clearForm();
}

function saveTabs() {
	clearForm();
	console.log('Inside close Tabs');

	chrome.tabs.getAllInWindow(null, function(tabs) {
		var form = document.createElement("form");
		form.id = "tabSubmitForm";
		
		var currentdate = new Date(); 
		var tabRecKey = "TabCap:" + currentdate.getDate() + "/"
				+ (currentdate.getMonth()+1)  + "/" 
				+ currentdate.getFullYear() + "@"  
				+ currentdate.getHours() + ":"  
				+ currentdate.getMinutes() + ":" 
				+ currentdate.getSeconds();

		createText(form, "tabRecKey", tabRecKey, "Record Key: ");

		for (var i = 0; i < tabs.length; i++) {
			createCheckBox(form, tabs[i].title, tabs[i].url, true,
							"cbox" + i.toString(),
							trimString(tabs[i].title, 50));
		}
		addBreakLine(form);
		createButton(form, "save", saveTabsCB);
		createButton(form, "bookmark", bookmarkTabsCB);

		document.getElementsByTagName('body')[0].appendChild(form);
	});
}

function openTabs() {
	clearForm();
	console.log('Inside open Tabs');

	chrome.storage.sync.get(null, function(entries) {
		console.log(entries);
		var form = document.createElement("form");
		form.id = "tabSubmitForm";
		for (key in entries) {
			console.log(key);
			createRadio(form, key, entries[key]);
		}
		addBreakLine(form);
		createButton(form, "open", openTabsCB);
		document.getElementsByTagName('body')[0].appendChild(form);
	});
}

function clearTabsCB(e) {

	var el = document.getElementById('tabSubmitForm').elements;

	for (var i = 0; i < el.length; i++) {
		if (el[i].type && el[i].type == "checkbox" && el[i].checked) {
			console.log(el[i].value);
			chrome.storage.sync.remove(el[i].value, function() {
				console.log("Storage cleared for " + el[i].value);
			});
		}
	}

	clearForm();
}

function clearTabs() {
	clearForm();
	console.log('Inside clear Tabs');

	chrome.storage.sync.get(null, function(entries) {
		console.log(entries);
		var form = document.createElement("form");
		form.id = "tabSubmitForm";
		for (key in entries) {
			console.log(key);
			createCheckBox(form, key, key, true, key, key);
		}
		addBreakLine(form);
		createButton(form, "delete", clearTabsCB);
		document.getElementsByTagName('body')[0].appendChild(form);
	});
}

function updateTabsCB(e) {

	var el = document.getElementById('tabSubmitForm').elements;

	for (var i = 0; i < el.length; i++) {
		if (el[i].type && el[i].type == "radio" && el[i].checked) {

			clearForm();
			var tabRecKey = el[i].name; 
			var form = document.createElement("form");
			form.id = "tabSubmitForm";
		
			console.log(el[i].value);
			createText(form, "tabRecKey", tabRecKey, "Record Key: ");

			var tabs = JSON.parse(el[i].value);
			for (var i = 0; i < tabs.length; i++) {
				createCheckBox(form, tabs[i].title, tabs[i].url, true,
							"cbox" + i.toString(),
							trimString(tabs[i].title, 50), "existing");
			}

			chrome.tabs.getAllInWindow(null, function(tabs) {


				for (var j = 0; j < tabs.length; j++) {
					createCheckBox(form, tabs[j].title, tabs[j].url, true,
							"cbox" + (i+j).toString(),
							trimString(tabs[j].title, 50));
				}
				addBreakLine(form);
				createButton(form, "save", saveTabsCB);
				createButton(form, "bookmark", bookmarkTabsCB);

				document.getElementsByTagName('body')[0].appendChild(form);
			});
			break;
		}
	}

	clearForm();
}

function updateTabs() {
	clearForm();
	console.log('Inside update Tabs');

	chrome.storage.sync.get(null, function(entries) {
		console.log(entries);
		var form = document.createElement("form");
		form.id = "tabSubmitForm";
		for (key in entries) {
			console.log(key);
			createRadio(form, key, entries[key]);
		}
		addBreakLine(form);
		createButton(form, "update", updateTabsCB);
		document.getElementsByTagName('body')[0].appendChild(form);
	});
}

function onInit(e) {
	document.getElementById('openButton').onclick = openTabs;
	document.getElementById('closeButton').onclick = saveTabs;
	document.getElementById('clearButton').onclick = clearTabs;
	document.getElementById('updateButton').onclick = updateTabs;
}
