#!/usr/bin/env node
import { fileURLToPath as __jtoBuildFileURLToPath } from 'url';
import { dirname as __jtoBuildDirname } from 'path';
const __filename = __jtoBuildFileURLToPath(import.meta.url);
const __dirname = __jtoBuildDirname(__filename);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/md-to-adf/dist/index.js
var require_dist = __commonJS({
  "node_modules/md-to-adf/dist/index.js"(exports, module) {
    module.exports = /******/
    (function(modules, runtime) {
      "use strict";
      var installedModules = {};
      function __webpack_require__(moduleId) {
        if (installedModules[moduleId]) {
          return installedModules[moduleId].exports;
        }
        var module2 = installedModules[moduleId] = {
          /******/
          i: moduleId,
          /******/
          l: false,
          /******/
          exports: {}
          /******/
        };
        modules[moduleId].call(module2.exports, module2, module2.exports, __webpack_require__);
        module2.l = true;
        return module2.exports;
      }
      __webpack_require__.ab = __dirname + "/";
      function startup() {
        return __webpack_require__(503);
      }
      ;
      return startup();
    })({
      /***/
      103: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const mark_1 = __webpack_require__(711);
          class Strike extends mark_1.Mark {
            constructor() {
              super("strike");
            }
          }
          exports2.Strike = Strike;
        })
      ),
      /***/
      135: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const emoji_1 = __webpack_require__(526);
          const hard_break_1 = __webpack_require__(570);
          const index_1 = __webpack_require__(492);
          const mention_1 = __webpack_require__(962);
          const text_1 = __webpack_require__(171);
          class Decision {
            constructor(localId, state) {
              this.localId = localId;
              this.state = state;
              this.content = new index_1.ContentNode("decisionItem");
            }
            text(text, marks) {
              return this.add(new text_1.Text(text, marks));
            }
            code(text) {
              return this.add(text_1.code(text));
            }
            em(text) {
              return this.add(text_1.em(text));
            }
            link(text, href, title) {
              return this.add(text_1.link(text, href, title));
            }
            strike(text) {
              return this.add(text_1.strike(text));
            }
            strong(text) {
              return this.add(text_1.strong(text));
            }
            mention(id, text) {
              return this.add(new mention_1.Mention(id, text));
            }
            emoji(shortName, id, text) {
              return this.add(new emoji_1.Emoji({ shortName, id, text }));
            }
            hardBreak() {
              return this.add(new hard_break_1.HardBreak());
            }
            add(node) {
              this.content.add(node);
              return this;
            }
            toJSON() {
              return Object.assign({}, this.content.toJSON(), { attrs: {
                localId: this.localId,
                state: this.state
              } });
            }
          }
          exports2.Decision = Decision;
        })
      ),
      /***/
      147: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const emoji_1 = __webpack_require__(526);
          const hard_break_1 = __webpack_require__(570);
          const index_1 = __webpack_require__(492);
          const mention_1 = __webpack_require__(962);
          const text_1 = __webpack_require__(171);
          class Paragraph extends index_1.TopLevelNode {
            constructor() {
              super(...arguments);
              this.content = new index_1.ContentNode("paragraph");
            }
            text(text, marks) {
              return this.add(new text_1.Text(text, marks));
            }
            code(text) {
              return this.add(text_1.code(text));
            }
            em(text) {
              return this.add(text_1.em(text));
            }
            link(text, href, title) {
              return this.add(text_1.link(text, href, title));
            }
            strong(text) {
              return this.add(text_1.strong(text));
            }
            mention(id, text) {
              return this.add(new mention_1.Mention(id, text));
            }
            emoji(shortName, id, text) {
              return this.add(new emoji_1.Emoji({ shortName, id, text }));
            }
            hardBreak() {
              return this.add(new hard_break_1.HardBreak());
            }
            add(node) {
              this.content.add(node);
              return this;
            }
            toJSON() {
              return this.content.toJSON();
            }
          }
          exports2.Paragraph = Paragraph;
        })
      ),
      /***/
      171: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const index_1 = __webpack_require__(812);
          const index_2 = __webpack_require__(492);
          function plain(text) {
            return new Text(text);
          }
          exports2.plain = plain;
          function strike(text) {
            return new Text(text, index_1.marks().strike());
          }
          exports2.strike = strike;
          function strong(text) {
            return new Text(text, index_1.marks().strong());
          }
          exports2.strong = strong;
          function em(text) {
            return new Text(text, index_1.marks().em());
          }
          exports2.em = em;
          function link(text, href, title) {
            return new Text(text, index_1.marks().link(href, title));
          }
          exports2.link = link;
          function code(text) {
            return new Text(text, index_1.marks().code());
          }
          exports2.code = code;
          class Text extends index_2.InlineNode {
            constructor(text, marks) {
              super();
              this.text = text;
              this.marks = marks;
              if (!text || text.length === 0) {
                throw new Error("Text must be at least one character long");
              }
            }
            toJSON() {
              const textNode = {
                type: "text",
                text: this.text
              };
              if (this.marks) {
                textNode.marks = this.marks.toJSON();
              }
              return textNode;
            }
          }
          exports2.Text = Text;
        })
      ),
      /***/
      192: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const mark_1 = __webpack_require__(711);
          class Strong extends mark_1.Mark {
            constructor() {
              super("strong");
            }
          }
          exports2.Strong = Strong;
        })
      ),
      /***/
      197: (
        /***/
        (function(module2, __unusedexports, __webpack_require__) {
          const translateMarkdownLineToIR = __webpack_require__(572);
          function buildTreeFromMarkdown(rawTextMarkdown) {
            const cleanedCodeBlock = collapseCodeBloc(rawTextMarkdown);
            const blockquotedNodes = collapseBlockquote(cleanedCodeBlock);
            const breakedLineNodes = collapseParagraph(blockquotedNodes);
            const accumulatedNodes = accumulateLevelFromList(breakedLineNodes);
            const levelsPosition = createLevelList(accumulatedNodes);
            const elementMap = mapIRToLevels(accumulatedNodes, levelsPosition);
            return buildTreeFromLevelMap(elementMap);
          }
          function collapseCodeBloc(rawIROfMarkdown) {
            const { codeBlockHandled } = rawIROfMarkdown.split(/\r\n|\r|\n/).reduce(({ codeBlockHandled: codeBlockHandled2, indexCurrentCodeBloc }, currentLine) => {
              const lineTranslation = translateMarkdownLineToIR(currentLine);
              if (typeof indexCurrentCodeBloc === "undefined" && (lineTranslation.adfType === "codeBlock" || lineTranslation.nodeAttached)) {
                codeBlockHandled2.push(lineTranslation);
                if (lineTranslation.nodeAttached) {
                  codeBlockHandled2.push(lineTranslation.nodeAttached);
                }
                return { codeBlockHandled: codeBlockHandled2, indexCurrentCodeBloc: codeBlockHandled2.length - 1 };
              }
              if (typeof indexCurrentCodeBloc !== "undefined" && (lineTranslation.adfType !== "codeBlock" || typeof lineTranslation.typeParam === "undefined" || lineTranslation.typeParam !== "")) {
                const textToAdd = lineTranslation.textPosition >= codeBlockHandled2[indexCurrentCodeBloc].textPosition ? currentLine.slice(codeBlockHandled2[indexCurrentCodeBloc].textPosition) : currentLine;
                codeBlockHandled2[indexCurrentCodeBloc].textToEmphasis = codeBlockHandled2[indexCurrentCodeBloc].textToEmphasis + (codeBlockHandled2[indexCurrentCodeBloc].textToEmphasis === "" ? textToAdd : "\n" + textToAdd);
                return { codeBlockHandled: codeBlockHandled2, indexCurrentCodeBloc };
              }
              if (typeof indexCurrentCodeBloc !== "undefined" && lineTranslation.adfType === "codeBlock" && typeof lineTranslation.typeParam !== "undefined" && lineTranslation.typeParam === "") {
                return { codeBlockHandled: codeBlockHandled2 };
              }
              codeBlockHandled2.push(lineTranslation);
              return { codeBlockHandled: codeBlockHandled2 };
            }, { codeBlockHandled: [] });
            const cleanedCodeBlock = codeBlockHandled.filter((currentNode) => {
              if (currentNode.adfType !== "codeBlock")
                return currentNode;
              if (currentNode.textToEmphasis !== "")
                return currentNode;
            });
            return cleanedCodeBlock;
          }
          function collapseBlockquote(rawIROfMarkdown) {
            const { blockquotedNodes } = rawIROfMarkdown.reduce(({ blockquotedNodes: blockquotedNodes2, currentLastThatWasBlockQuote }, currentLineNode) => {
              if (!currentLastThatWasBlockQuote && currentLineNode.adfType === "blockQuote") {
                blockquotedNodes2.push(currentLineNode);
                return { blockquotedNodes: blockquotedNodes2, currentLastThatWasBlockQuote: currentLineNode };
              }
              if (currentLastThatWasBlockQuote && currentLineNode.adfType === "blockQuote") {
                currentLastThatWasBlockQuote.textToEmphasis = currentLastThatWasBlockQuote.textToEmphasis + " " + currentLineNode.textToEmphasis;
                return { blockquotedNodes: blockquotedNodes2, currentLastThatWasBlockQuote };
              }
              blockquotedNodes2.push(currentLineNode);
              return { blockquotedNodes: blockquotedNodes2 };
            }, { blockquotedNodes: [] });
            return blockquotedNodes;
          }
          function collapseParagraph(rawIROfMarkdown) {
            const { breakedLineNodes } = rawIROfMarkdown.reduce(({ breakedLineNodes: breakedLineNodes2, currentParent, lastWasAlsoAParagraph }, currentLineNode) => {
              if (currentLineNode.adfType === "heading" || currentLineNode.adfType === "divider" || currentLineNode.adfType === "codeBlock") {
                breakedLineNodes2.push(currentLineNode);
                return { breakedLineNodes: breakedLineNodes2 };
              }
              if (currentLineNode.adfType !== "paragraph") {
                breakedLineNodes2.push(currentLineNode);
                return { breakedLineNodes: breakedLineNodes2, currentParent: currentLineNode };
              }
              if (!lastWasAlsoAParagraph && /^(?:[\s]*)$/.test(currentLineNode.textToEmphasis)) {
                return { breakedLineNodes: breakedLineNodes2, lastWasAlsoAParagraph: true };
              }
              if (lastWasAlsoAParagraph && /^(?:[\s]*)$/.test(currentLineNode.textToEmphasis)) {
                breakedLineNodes2.push(currentLineNode);
                return { breakedLineNodes: breakedLineNodes2 };
              }
              if (currentParent) {
                const textToAdd = currentLineNode.textPosition >= currentParent.textPosition ? currentLineNode.textToEmphasis.slice(currentParent.textPosition) : currentLineNode.textToEmphasis;
                currentParent.textToEmphasis = currentParent.textToEmphasis + (currentLineNode.textToEmphasis.charAt(0) !== " " ? " " + textToAdd : textToAdd);
                return { breakedLineNodes: breakedLineNodes2, currentParent };
              }
              breakedLineNodes2.push(currentLineNode);
              return { breakedLineNodes: breakedLineNodes2, currentParent: currentLineNode };
            }, { breakedLineNodes: [] });
            return breakedLineNodes;
          }
          function accumulateLevelFromList(rawIROfMarkdown) {
            const { accumulatedNodes } = rawIROfMarkdown.reduce(({ accumulatedNodes: accumulatedNodes2, indexCurrentList }, currentLineNode) => {
              if (currentLineNode.adfType !== "heading" && currentLineNode.adfType !== "divider" && currentLineNode.adfType !== "orderedList" && currentLineNode.adfType !== "bulletList" && indexCurrentList && currentLineNode.textPosition < accumulatedNodes2[indexCurrentList].textPosition + 2) {
                currentLineNode.textPosition = accumulatedNodes2[indexCurrentList].textPosition + 2;
              }
              accumulatedNodes2.push(currentLineNode);
              if (currentLineNode.adfType === "heading" || currentLineNode.adfType === "divider")
                return { accumulatedNodes: accumulatedNodes2 };
              if (currentLineNode.adfType === "bulletList" || currentLineNode.adfType === "orderedList") {
                return { accumulatedNodes: accumulatedNodes2, indexCurrentList: accumulatedNodes2.length - 1 };
              }
              return { accumulatedNodes: accumulatedNodes2, indexCurrentList };
            }, { accumulatedNodes: [] });
            return accumulatedNodes;
          }
          function createLevelList(rawIROfMarkdown) {
            return rawIROfMarkdown.reduce((currentLevelList, currentNode) => {
              if (currentNode.adfType !== "orderedList" && currentNode.adfType !== "bulletList")
                return currentLevelList;
              return currentLevelList.includes(currentNode.textPosition + 2) || currentLevelList.includes(currentNode.textPosition + 3) ? currentLevelList : currentNode.textPosition + 2 > currentLevelList[currentLevelList.length - 1] + 1 ? [...currentLevelList, currentNode.textPosition + 2] : currentLevelList;
            }, [0]);
          }
          function mapIRToLevels(rawIROfMarkdown, levelsPosition) {
            return levelsPosition.map((currentLevelPosition, currentIndex) => {
              return rawIROfMarkdown.filter((currentList) => currentList.textPosition >= currentLevelPosition && (currentIndex === levelsPosition.length - 1 || currentList.textPosition < levelsPosition[currentIndex + 1])).map((currentList) => ({
                indexOfList: rawIROfMarkdown.indexOf(currentList),
                children: [],
                node: currentList
              }));
            });
          }
          function buildTreeFromLevelMap(levelsMap) {
            const treeOfNode = levelsMap.reduce((currentTree, currentArrayOfListIndexes, currentIndexInTheArrayOfListIndexes) => {
              const stepAtTree = currentArrayOfListIndexes.reduce((currentTreeValues, currentListValues) => {
                if (currentIndexInTheArrayOfListIndexes <= 0)
                  return [...currentTreeValues, currentListValues];
                const parentList = levelsMap[currentIndexInTheArrayOfListIndexes - 1];
                const lastParentWithIndexBelow = parentList.findIndex((currentParentListIndex) => {
                  return currentParentListIndex.indexOfList > currentListValues.indexOfList;
                });
                const parentIndexToUse = lastParentWithIndexBelow === -1 ? parentList.length - 1 : lastParentWithIndexBelow === 0 ? 0 : lastParentWithIndexBelow - 1;
                if (parentIndexToUse < 0)
                  throw "Parent list of node is empty!";
                parentList[parentIndexToUse].children.push(currentListValues);
                return currentTreeValues;
              }, currentTree);
              return stepAtTree;
            }, []);
            return treeOfNode;
          }
          module2.exports = buildTreeFromMarkdown;
        })
      ),
      /***/
      198: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const decision_1 = __webpack_require__(135);
          const index_1 = __webpack_require__(492);
          class DecisionList extends index_1.TopLevelNode {
            constructor(localId) {
              super();
              this.localId = localId;
              this.content = new index_1.ContentNode("decisionList");
            }
            decision(localId, state) {
              return this.content.add(new decision_1.Decision(localId, state));
            }
            toJSON() {
              return Object.assign({}, this.content.toJSON(), { attrs: {
                localId: this.localId
              } });
            }
          }
          exports2.DecisionList = DecisionList;
        })
      ),
      /***/
      206: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const mark_1 = __webpack_require__(711);
          class Link extends mark_1.Mark {
            constructor(href, title) {
              super("link");
              this.href = href;
              this.title = title;
            }
            toJSON() {
              const linkMark = {
                type: this.type,
                attrs: {
                  href: this.href
                }
              };
              if (this.title) {
                linkMark.attrs.title = this.title;
              }
              return linkMark;
            }
          }
          exports2.Link = Link;
        })
      ),
      /***/
      223: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const index_1 = __webpack_require__(492);
          class Rule extends index_1.TopLevelNode {
            toJSON() {
              return {
                type: "rule"
              };
            }
          }
          exports2.Rule = Rule;
        })
      ),
      /***/
      270: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const bullet_list_1 = __webpack_require__(849);
          const heading_1 = __webpack_require__(366);
          const index_1 = __webpack_require__(492);
          const ordered_list_1 = __webpack_require__(982);
          const paragraph_1 = __webpack_require__(147);
          class Panel extends index_1.TopLevelNode {
            constructor(panelType) {
              super();
              this.panelType = panelType;
              this.content = new index_1.ContentNode("panel");
            }
            heading(level) {
              return this.content.add(new heading_1.Heading(level));
            }
            paragraph() {
              return this.content.add(new paragraph_1.Paragraph());
            }
            orderedList() {
              return this.content.add(new ordered_list_1.OrderedList());
            }
            bulletList() {
              return this.content.add(new bullet_list_1.BulletList());
            }
            toJSON() {
              return Object.assign({}, this.content.toJSON(), { attrs: {
                panelType: this.panelType
              } });
            }
          }
          exports2.Panel = Panel;
        })
      ),
      /***/
      284: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const emoji_1 = __webpack_require__(526);
          const hard_break_1 = __webpack_require__(570);
          const index_1 = __webpack_require__(492);
          const mention_1 = __webpack_require__(962);
          const text_1 = __webpack_require__(171);
          class Task {
            constructor(localId, state) {
              this.localId = localId;
              this.state = state;
              this.content = new index_1.ContentNode("taskItem");
            }
            text(text, marks) {
              return this.add(new text_1.Text(text, marks));
            }
            code(text) {
              return this.add(text_1.code(text));
            }
            em(text) {
              return this.add(text_1.em(text));
            }
            link(text, href, title) {
              return this.add(text_1.link(text, href, title));
            }
            strike(text) {
              return this.add(text_1.strike(text));
            }
            strong(text) {
              return this.add(text_1.strong(text));
            }
            mention(id, text) {
              return this.add(new mention_1.Mention(id, text));
            }
            emoji(shortName, id, text) {
              return this.add(new emoji_1.Emoji({ shortName, id, text }));
            }
            hardBreak() {
              return this.add(new hard_break_1.HardBreak());
            }
            add(node) {
              this.content.add(node);
              return this;
            }
            toJSON() {
              return Object.assign({}, this.content.toJSON(), { attrs: {
                localId: this.localId,
                state: this.state
              } });
            }
          }
          exports2.Task = Task;
          var TaskState;
          (function(TaskState2) {
            TaskState2["TODO"] = "TODO";
            TaskState2["DONE"] = "DONE";
          })(TaskState = exports2.TaskState || (exports2.TaskState = {}));
        })
      ),
      /***/
      286: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          function __export(m) {
            for (var p in m) if (!exports2.hasOwnProperty(p)) exports2[p] = m[p];
          }
          Object.defineProperty(exports2, "__esModule", { value: true });
          var document_1 = __webpack_require__(802);
          exports2.Document = document_1.Document;
          var tag_1 = __webpack_require__(322);
          exports2.document = tag_1.document;
          __export(__webpack_require__(451));
          __export(__webpack_require__(893));
          __export(__webpack_require__(849));
          __export(__webpack_require__(561));
          __export(__webpack_require__(198));
          __export(__webpack_require__(135));
          __export(__webpack_require__(526));
          __export(__webpack_require__(570));
          __export(__webpack_require__(366));
          __export(__webpack_require__(566));
          __export(__webpack_require__(823));
          __export(__webpack_require__(371));
          __export(__webpack_require__(962));
          __export(__webpack_require__(982));
          __export(__webpack_require__(270));
          __export(__webpack_require__(147));
          __export(__webpack_require__(223));
          __export(__webpack_require__(976));
          __export(__webpack_require__(284));
          __export(__webpack_require__(171));
          __export(__webpack_require__(812));
        })
      ),
      /***/
      294: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const mark_1 = __webpack_require__(711);
          class Underline extends mark_1.Mark {
            constructor() {
              super("underline");
            }
          }
          exports2.Underline = Underline;
        })
      ),
      /***/
      322: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const document_1 = __webpack_require__(802);
          const index_1 = __webpack_require__(492);
          function document(strings, ...args) {
            const doc = new document_1.Document();
            const paragraph = doc.paragraph();
            for (let i = 0; i < args.length; i++) {
              if (strings[i].length) {
                paragraph.text(strings[i]);
              }
              if (args[i] instanceof index_1.TopLevelNode) {
                throw new Error("Top level nodes cannot be used in tagged templates");
              }
              if (args[i] instanceof index_1.InlineNode) {
                paragraph.add(args[i]);
              } else {
                const stringified = String(args[i]);
                if (stringified.length > 0) {
                  paragraph.text(stringified);
                }
              }
            }
            if (strings[args.length].length > 0) {
              paragraph.text(strings[args.length]);
            }
            return doc;
          }
          exports2.document = document;
        })
      ),
      /***/
      326: (
        /***/
        (function(module2, __unusedexports, __webpack_require__) {
          const { marks, Heading, Text, Emoji, BulletList, OrderedList, ListItem, CodeBlock, BlockQuote, Paragraph, Rule } = __webpack_require__(286);
          const attachTextToNodeSliceEmphasis = __webpack_require__(804);
          function fillADFNodesWithMarkdown(currentParentNode, currentArrayOfNodesOfSameIndent) {
            currentArrayOfNodesOfSameIndent.reduce((lastListNode, currentNode) => {
              const nodeOrListNode = lastListNode !== null && (currentNode.node.adfType === "orderedList" || currentNode.node.adfType === "bulletList") && lastListNode.content.type === currentNode.node.adfType ? lastListNode : addTypeToNode(currentParentNode, currentNode.node.adfType, currentNode.node.typeParam);
              const nodeOrListItem = currentNode.node.adfType === "orderedList" || currentNode.node.adfType === "bulletList" ? nodeOrListNode.content.add(new ListItem()) : nodeOrListNode;
              const nodeToAttachTextTo = currentNode.node.adfType === "orderedList" || currentNode.node.adfType === "bulletList" || currentNode.node.adfType === "blockQuote" ? typeof currentNode.node.textToEmphasis !== "undefined" || currentNode.children.length === 0 ? nodeOrListItem.content.add(new Paragraph()) : nodeOrListItem : nodeOrListItem;
              if (currentNode.node.adfType === "divider")
                return lastListNode;
              else if (currentNode.node.adfType !== "codeBlock" && currentNode.node.textToEmphasis)
                attachItemNode(nodeToAttachTextTo, currentNode.node.textToEmphasis);
              else if (currentNode.node.adfType !== "codeBlock" && currentNode.node.textToEmphasis === "")
                attachItemNode(nodeToAttachTextTo, " ");
              else if (currentNode.node.adfType === "codeBlock")
                attachTextToNodeRaw(nodeToAttachTextTo, currentNode.node.textToEmphasis);
              if (currentNode.children)
                fillADFNodesWithMarkdown(nodeOrListItem, currentNode.children);
              return currentNode.node.adfType !== "orderedList" && currentNode.node.adfType !== "bulletList" || (!lastListNode || currentNode.node.adfType === lastListNode.content.type) ? nodeOrListNode : lastListNode;
            }, null);
          }
          function addTypeToNode(adfNodeToAttachTo, adfType, typeParams) {
            switch (adfType) {
              case "heading":
                return adfNodeToAttachTo.content.add(new Heading(typeParams));
              case "divider":
                return adfNodeToAttachTo.content.add(new Rule());
              case "bulletList":
                return adfNodeToAttachTo.content.add(new BulletList());
              case "orderedList": {
                const orderedListNode = new OrderedList();
                if (typeParams) orderedListNode.attrs = { order: typeParams };
                return adfNodeToAttachTo.content.add(orderedListNode);
              }
              case "codeBlock":
                return adfNodeToAttachTo.content.add(new CodeBlock(typeParams));
              case "blockQuote":
                return adfNodeToAttachTo.content.add(new BlockQuote());
              case "paragraph":
                return adfNodeToAttachTo.content.add(new Paragraph());
              default:
                throw "incompatible type";
            }
          }
          function attachItemNode(nodeToAttachTo, rawText) {
            const slicedInline = sliceInLineCode(rawText);
            const { slicedInlineAndEmoji } = slicedInline.reduce(({ slicedInlineAndEmoji: slicedInlineAndEmoji2 }, currentSlice) => {
              if (!currentSlice.isMatching) {
                const slicedEmoji = sliceEmoji(currentSlice.text);
                return { slicedInlineAndEmoji: slicedInlineAndEmoji2.concat(slicedEmoji) };
              }
              slicedInlineAndEmoji2.push(currentSlice);
              return { slicedInlineAndEmoji: slicedInlineAndEmoji2 };
            }, { slicedInlineAndEmoji: [] });
            const { slicedInlineAndEmojiAndLink } = slicedInlineAndEmoji.reduce(({ slicedInlineAndEmojiAndLink: slicedInlineAndEmojiAndLink2 }, currentSlice) => {
              if (!currentSlice.isMatching) {
                const slicedLink = sliceLink(currentSlice.text);
                return { slicedInlineAndEmojiAndLink: slicedInlineAndEmojiAndLink2.concat(slicedLink) };
              }
              slicedInlineAndEmojiAndLink2.push(currentSlice);
              return { slicedInlineAndEmojiAndLink: slicedInlineAndEmojiAndLink2 };
            }, { slicedInlineAndEmojiAndLink: [] });
            for (const currentSlice of slicedInlineAndEmojiAndLink) {
              switch (currentSlice.type) {
                case "inline":
                  const inlineCodeNode = new Text(currentSlice.text, marks().code());
                  nodeToAttachTo.content.add(inlineCodeNode);
                  break;
                case "emoji":
                  const emojiNode = new Emoji({ shortName: currentSlice.text });
                  nodeToAttachTo.content.add(emojiNode);
                  break;
                case "link":
                  const linkNode = new Text(
                    currentSlice.text,
                    marks().link(
                      currentSlice.optionalText1,
                      currentSlice.optionalText2
                    )
                  );
                  nodeToAttachTo.content.add(linkNode);
                  break;
                case "image":
                  const imageNode = new Text(
                    currentSlice.text,
                    marks().link(
                      currentSlice.optionalText1,
                      currentSlice.optionalText2
                    )
                  );
                  nodeToAttachTo.content.add(imageNode);
                  break;
                default:
                  attachTextToNodeSliceEmphasis(nodeToAttachTo, currentSlice.text);
              }
            }
          }
          function sliceInLineCode(rawText) {
            return sliceOneMatchFromRegexp(rawText, "inline", /(?<nonMatchBefore>[^`]*)(?:`(?<match>[^`]+)`)(?<nonMatchAfter>[^`]*)/g);
          }
          function sliceEmoji(rawText) {
            return sliceOneMatchFromRegexp(rawText, "emoji", /(?<nonMatchBefore>[^`]*)(?::(?<match>[^`\s]+):)(?<nonMatchAfter>[^`]*)/g);
          }
          function sliceLink(rawText) {
            return sliceOneMatchFromRegexp(rawText, "link", /(?<nonMatchBefore>[^`]*)(?:\[(?<match>[^\[\]]+)\]\((?<matchOptional>[^\(\)"]+)(?: "(?<matchOptional2>[^"]*)")?\))(?<nonMatchAfter>[^`]*)/g);
          }
          function sliceOneMatchFromRegexp(rawText, typeTag, regexpToSliceWith) {
            let slicesResult = [];
            let snippet = null;
            let hasAtLeastOneExpression = false;
            while (snippet = regexpToSliceWith.exec(rawText)) {
              hasAtLeastOneExpression = true;
              if (snippet.groups.nonMatchBefore) {
                slicesResult.push({ isMatching: false, text: snippet.groups.nonMatchBefore });
              }
              if (snippet.groups.match) {
                slicesResult.push({
                  isMatching: true,
                  type: typeTag,
                  text: snippet.groups.match,
                  optionalText1: snippet.groups.matchOptional,
                  optionalText2: snippet.groups.matchOptional2
                });
              }
              if (snippet.groups.nonMatchAfter) {
                slicesResult.push({ isMatching: false, text: snippet.groups.nonMatchAfter });
              }
            }
            if (!hasAtLeastOneExpression)
              slicesResult.push({ isMatching: false, text: rawText });
            return slicesResult;
          }
          function attachTextToNodeRaw(nodeToAttachTo, textToAttach) {
            const textNode = new Text(textToAttach);
            nodeToAttachTo.content.add(textNode);
          }
          module2.exports = fillADFNodesWithMarkdown;
        })
      ),
      /***/
      366: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const index_1 = __webpack_require__(492);
          const text_1 = __webpack_require__(171);
          class Heading extends index_1.TopLevelNode {
            constructor(level) {
              super();
              this.level = level;
              this.content = new index_1.ContentNode("heading");
              if (level < 1 || level > 6) {
                throw new Error("Level must be in the range of 1-6");
              }
            }
            link(text, href, title) {
              this.content.add(text_1.link(text, href, title));
              return this;
            }
            text(text) {
              this.content.add(text_1.plain(text));
              return this;
            }
            toJSON() {
              return Object.assign({}, this.content.toJSON(), { attrs: {
                level: this.level
              } });
            }
          }
          exports2.Heading = Heading;
        })
      ),
      /***/
      371: (
        /***/
        (function(__unusedmodule, exports2) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          class Media {
            constructor(attrs) {
              this.attrs = attrs;
            }
            toJSON() {
              const media = {
                type: "media",
                attrs: {
                  id: this.attrs.id,
                  type: this.attrs.type,
                  collection: this.attrs.collection
                }
              };
              if (this.attrs.occurrenceKey) {
                media.attrs.occurrenceKey = this.attrs.occurrenceKey;
              }
              return media;
            }
          }
          exports2.Media = Media;
        })
      ),
      /***/
      396: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const mark_1 = __webpack_require__(711);
          class SubSup extends mark_1.Mark {
            constructor(variant) {
              super("subsup");
              this.variant = variant;
            }
            toJSON() {
              return {
                type: this.type,
                attrs: {
                  type: this.variant
                }
              };
            }
          }
          exports2.SubSup = SubSup;
        })
      ),
      /***/
      400: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const mark_1 = __webpack_require__(711);
          class Em extends mark_1.Mark {
            constructor() {
              super("em");
            }
          }
          exports2.Em = Em;
        })
      ),
      /***/
      451: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const index_1 = __webpack_require__(492);
          class Action {
            title(title) {
              this.actionTitle = title;
              return this;
            }
            target(target) {
              if (!target.key) {
                throw new Error("Action target key is required");
              }
              this.actionTarget = target;
              return this;
            }
            parameters(parameters) {
              this.actionParameters = parameters;
              return this;
            }
            toJSON() {
              const action = {};
              if (this.actionTitle) {
                action.title = this.actionTitle;
              }
              if (this.actionTarget) {
                action.target = this.actionTarget;
              }
              if (this.actionParameters) {
                action.parameters = this.actionParameters;
              }
              if (Object.keys(action).length < 2) {
                throw new Error("Must set title and target attributes for action");
              }
              return action;
            }
          }
          exports2.Action = Action;
          class Detail {
            constructor() {
              this.detailUsers = [];
            }
            title(text) {
              this.detailTitle = text;
              return this;
            }
            text(text) {
              this.detailText = text;
              return this;
            }
            lozenge(lozenge) {
              this.detailLozenge = lozenge;
              return this;
            }
            icon(icon) {
              this.detailIcon = icon;
              return this;
            }
            badge(badge) {
              this.detailBadge = badge;
              return this;
            }
            user(user) {
              this.detailUsers.push(user);
              return this;
            }
            toJSON() {
              const detail = {};
              if (this.detailTitle) {
                detail.title = this.detailTitle;
              }
              if (this.detailText) {
                detail.text = this.detailText;
              }
              if (this.detailIcon) {
                detail.icon = this.detailIcon;
              }
              if (this.detailBadge) {
                detail.badge = this.detailBadge;
              }
              if (this.detailLozenge) {
                detail.lozenge = this.detailLozenge;
              }
              if (this.detailUsers.length > 0) {
                detail.users = this.detailUsers;
              }
              if (Object.keys(detail).length === 0) {
                throw new Error("Must at least set one attribute");
              }
              return detail;
            }
          }
          exports2.Detail = Detail;
          class Context {
            constructor(text) {
              this.text = text;
            }
            icon(icon) {
              this.contextIcon = icon;
              return this;
            }
            toJSON() {
              const context = {
                text: this.text
              };
              if (this.contextIcon) {
                context.icon = this.contextIcon;
              }
              return context;
            }
          }
          exports2.Context = Context;
          class TitleUser {
            constructor(titleUserIcon) {
              this.titleUserIcon = titleUserIcon;
            }
            id(id) {
              this.titleUserId = id;
              return this;
            }
            toJSON() {
              const titleUser = {
                icon: this.titleUserIcon
              };
              if (this.titleUserId) {
                titleUser.id = this.titleUserId;
              }
              return titleUser;
            }
          }
          exports2.TitleUser = TitleUser;
          class ApplicationCard extends index_1.TopLevelNode {
            constructor(title, text) {
              super();
              this.title = title;
              this.text = text;
              this.isCollapsible = false;
              this.details = [];
              this.actions = [];
            }
            link(url) {
              this.linkUrl = url;
              return this;
            }
            background(url) {
              this.backgroundUrl = url;
              return this;
            }
            preview(url) {
              this.previewUrl = url;
              return this;
            }
            collapsible(collapsible) {
              this.isCollapsible = collapsible;
              return this;
            }
            description(text) {
              this.descriptionText = text;
              return this;
            }
            titleUser(icon) {
              const titleUser = new TitleUser(icon);
              this.userInTitle = titleUser;
              return titleUser;
            }
            detail() {
              const detail = new Detail();
              this.details.push(detail);
              return detail;
            }
            action() {
              const action = new Action();
              this.actions.push(action);
              return action;
            }
            context(text) {
              this.cardContext = new Context(text);
              return this.cardContext;
            }
            toJSON() {
              const card = {
                type: "applicationCard",
                attrs: {
                  text: this.text || this.title,
                  title: {
                    text: this.title
                  },
                  collapsible: this.isCollapsible
                }
              };
              if (this.linkUrl) {
                card.attrs.textUrl = this.linkUrl;
                card.attrs.link = {
                  url: this.linkUrl
                };
              }
              if (this.backgroundUrl) {
                card.attrs.background = {
                  url: this.backgroundUrl
                };
              }
              if (this.previewUrl) {
                card.attrs.preview = {
                  url: this.previewUrl
                };
              }
              if (this.descriptionText) {
                card.attrs.description = {
                  text: this.descriptionText
                };
              }
              if (this.userInTitle) {
                card.attrs.title.user = this.userInTitle.toJSON();
              }
              if (this.details.length > 0) {
                card.attrs.details = this.details.map((detail) => detail.toJSON());
              }
              if (this.actions.length > 0) {
                card.attrs.actions = this.actions.map((action) => action.toJSON());
              }
              if (this.cardContext) {
                card.attrs.context = this.cardContext.toJSON();
              }
              return card;
            }
          }
          exports2.ApplicationCard = ApplicationCard;
        })
      ),
      /***/
      492: (
        /***/
        (function(__unusedmodule, exports2) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          class ContentNode {
            constructor(type, minLength = 1) {
              this.type = type;
              this.minLength = minLength;
              this.content = [];
            }
            toJSON() {
              if (this.content.length < this.minLength) {
                throw new Error(`There must be at least ${this.minLength} content elements`);
              }
              return {
                type: this.type,
                content: this.content.map((node) => node.toJSON())
              };
            }
            add(node) {
              if (!node) {
                throw new Error("Illegal value");
              }
              this.content.push(node);
              return node;
            }
          }
          exports2.ContentNode = ContentNode;
          class TopLevelNode {
          }
          exports2.TopLevelNode = TopLevelNode;
          class InlineNode {
          }
          exports2.InlineNode = InlineNode;
        })
      ),
      /***/
      503: (
        /***/
        (function(module2, __unusedexports, __webpack_require__) {
          const { Document } = __webpack_require__(286);
          const buildIRTreeFromMarkdown = __webpack_require__(197);
          const fillADFNodesWithMarkdown = __webpack_require__(326);
          function translateGITHUBMarkdownToADF(markdownText) {
            const textTree = buildIRTreeFromMarkdown(markdownText);
            const adfRoot = new Document();
            if (textTree.length > 0)
              fillADFNodesWithMarkdown(adfRoot, textTree);
            return adfRoot;
          }
          module2.exports = translateGITHUBMarkdownToADF;
        })
      ),
      /***/
      526: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const index_1 = __webpack_require__(492);
          function emoji(shortName, id, text) {
            return new Emoji({ shortName, id, text });
          }
          exports2.emoji = emoji;
          class Emoji extends index_1.InlineNode {
            constructor(attrs) {
              super();
              this.attrs = attrs;
            }
            toJSON() {
              const emojiNode = {
                type: "emoji",
                attrs: {
                  shortName: this.attrs.shortName
                }
              };
              if (this.attrs.id) {
                emojiNode.attrs.id = this.attrs.id;
              }
              if (this.attrs.text) {
                emojiNode.attrs.text = this.attrs.text;
              }
              return emojiNode;
            }
          }
          exports2.Emoji = Emoji;
        })
      ),
      /***/
      561: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const index_1 = __webpack_require__(492);
          const text_1 = __webpack_require__(171);
          class CodeBlock extends index_1.TopLevelNode {
            constructor(language) {
              super();
              this.language = language;
              this.content = new index_1.ContentNode("codeBlock");
            }
            text(code) {
              this.content.add(text_1.plain(code));
              return this;
            }
            toJSON() {
              const codeBlock = this.content.toJSON();
              if (this.language) {
                codeBlock.attrs = {
                  language: this.language
                };
              }
              return codeBlock;
            }
          }
          exports2.CodeBlock = CodeBlock;
        })
      ),
      /***/
      566: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const bullet_list_1 = __webpack_require__(849);
          const index_1 = __webpack_require__(492);
          const ordered_list_1 = __webpack_require__(982);
          const paragraph_1 = __webpack_require__(147);
          class ListItem {
            constructor() {
              this.content = new index_1.ContentNode("listItem");
            }
            paragraph() {
              return this.content.add(new paragraph_1.Paragraph());
            }
            bulletList() {
              return this.content.add(new bullet_list_1.BulletList());
            }
            orderedList() {
              return this.content.add(new ordered_list_1.OrderedList());
            }
            toJSON() {
              return this.content.toJSON();
            }
          }
          exports2.ListItem = ListItem;
        })
      ),
      /***/
      570: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const index_1 = __webpack_require__(492);
          function hardBreak() {
            return new HardBreak();
          }
          exports2.hardBreak = hardBreak;
          class HardBreak extends index_1.InlineNode {
            toJSON() {
              return {
                type: "hardBreak",
                attrs: {
                  text: "\n"
                }
              };
            }
          }
          exports2.HardBreak = HardBreak;
        })
      ),
      /***/
      572: (
        /***/
        (function(module2) {
          function parseMarkdownLinetoIR(markdownLineTextWithTabs) {
            const markdownLine = markdownLineTextWithTabs.replace(/\t/g, "    ");
            const headerNode = matchHeader(markdownLine);
            if (headerNode) return headerNode;
            const divider = matchDivider(markdownLine);
            if (divider) return divider;
            const listNode = matchList(markdownLine);
            if (listNode) return listNode;
            const blockQuoteNode = matchBlockQuote(markdownLine);
            if (blockQuoteNode) return blockQuoteNode;
            const codeBlockNode = matchCodeBlock(markdownLine);
            if (codeBlockNode) return codeBlockNode;
            const paragraphNode = matchParagraph(markdownLine);
            if (paragraphNode) return paragraphNode;
            return {
              adfType: "paragraph",
              textToEmphasis: "",
              textPosition: markdownLine.length
            };
          }
          function matchHeader(lineToMatch) {
            const headerType = lineToMatch.match(/^(?<headerNumber>[#]{1,6}) (?<headerText>.*)$/i);
            if (headerType && headerType.groups && headerType.groups.headerNumber && headerType.groups.headerText) {
              return {
                adfType: "heading",
                //adfRoot.heading( headerType.groups.headerNumber.length ),
                textToEmphasis: headerType.groups.headerText,
                typeParam: headerType.groups.headerNumber.length,
                textPosition: 0
              };
            }
            return null;
          }
          function matchList(lineToMatch) {
            const list = lineToMatch.match(/^(?:[\s])*(?:[*\-+] |(?<orderedNumber>[0-9]+)[.)] )+(?<listText>.*)$/i);
            if (list && list.groups && list.groups.listText) {
              const textIsCodeBlock = matchCodeBlock(list.groups.listText);
              if (textIsCodeBlock)
                textIsCodeBlock.textPosition = lineToMatch.indexOf(list.groups.listText);
              return {
                adfType: list.groups.orderedNumber ? "orderedList" : "bulletList",
                typeParam: list.groups.orderedNumber,
                textToEmphasis: textIsCodeBlock ? "" : list.groups.listText,
                textPosition: lineToMatch.indexOf(list.groups.listText) - 2,
                nodeAttached: textIsCodeBlock
              };
            }
            return null;
          }
          function matchCodeBlock(lineToMatch) {
            const codeBlock = lineToMatch.match(/^(?:[\s]*```)(?<Language>[^\s]*)$/i);
            if (codeBlock && codeBlock.groups) {
              return {
                adfType: "codeBlock",
                typeParam: codeBlock.groups.Language,
                textPosition: lineToMatch.indexOf("```"),
                textToEmphasis: ""
              };
            }
            return null;
          }
          function matchBlockQuote(lineToMatch) {
            const blockquote = lineToMatch.match(/^(?:[\s])*> (?<quoteText>.*)$/i);
            if (blockquote && blockquote.groups && blockquote.groups.quoteText) {
              return {
                adfType: "blockQuote",
                textToEmphasis: blockquote.groups.quoteText,
                textPosition: lineToMatch.indexOf("> ")
              };
            }
            return null;
          }
          function matchParagraph(lineToMatch) {
            const paragraph = lineToMatch.match(/^(?:[\s]*)(?<paragraphText>[^\n]+)$/);
            if (paragraph && paragraph.groups && paragraph.groups.paragraphText) {
              return {
                adfType: "paragraph",
                textToEmphasis: paragraph.groups.paragraphText,
                textPosition: !paragraph.groups.paragraphText.match(/^(?:[\s]*)$/) ? lineToMatch.indexOf(paragraph.groups.paragraphText) : lineToMatch.length
              };
            }
            return null;
          }
          function matchDivider(lineToMatch) {
            const divider = lineToMatch.match(/^(\s*-{3,}\s*|\s*\*{3,}\s*|\s*_{3,}\s*)$/);
            if (divider) {
              return {
                adfType: "divider",
                textToEmphasis: "",
                textPosition: 0
              };
            }
            return null;
          }
          module2.exports = parseMarkdownLinetoIR;
        })
      ),
      /***/
      601: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const mark_1 = __webpack_require__(711);
          class Code extends mark_1.Mark {
            constructor() {
              super("code");
            }
          }
          exports2.Code = Code;
        })
      ),
      /***/
      620: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const mark_1 = __webpack_require__(711);
          class Action extends mark_1.Mark {
            constructor(title, target, actionParameters) {
              super("action");
              this.title = title;
              this.target = target;
              this.actionParameters = actionParameters;
            }
            toJSON() {
              const actionMark = {
                type: this.type,
                attrs: {
                  title: this.title,
                  target: this.target
                }
              };
              if (this.actionParameters) {
                actionMark.attrs.parameters = this.actionParameters;
              }
              return actionMark;
            }
          }
          exports2.Action = Action;
        })
      ),
      /***/
      711: (
        /***/
        (function(__unusedmodule, exports2) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          class Mark {
            constructor(type) {
              this.type = type;
            }
            toJSON() {
              return {
                type: this.type
              };
            }
          }
          exports2.Mark = Mark;
        })
      ),
      /***/
      802: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const nodes_1 = __webpack_require__(492);
          const application_card_1 = __webpack_require__(451);
          const block_quote_1 = __webpack_require__(893);
          const bullet_list_1 = __webpack_require__(849);
          const code_block_1 = __webpack_require__(561);
          const decision_list_1 = __webpack_require__(198);
          const heading_1 = __webpack_require__(366);
          const media_group_1 = __webpack_require__(823);
          const ordered_list_1 = __webpack_require__(982);
          const panel_1 = __webpack_require__(270);
          const paragraph_1 = __webpack_require__(147);
          const rule_1 = __webpack_require__(223);
          const task_list_1 = __webpack_require__(976);
          class Document {
            constructor(attrs = { version: 1 }) {
              this.attrs = attrs;
              this.content = new nodes_1.ContentNode("doc");
            }
            applicationCard(title, text) {
              return this.content.add(new application_card_1.ApplicationCard(title, text));
            }
            blockQuote() {
              return this.content.add(new block_quote_1.BlockQuote());
            }
            bulletList() {
              return this.content.add(new bullet_list_1.BulletList());
            }
            codeBlock(language) {
              return this.content.add(new code_block_1.CodeBlock(language));
            }
            decisionList(localId) {
              return this.content.add(new decision_list_1.DecisionList(localId));
            }
            heading(level) {
              return this.content.add(new heading_1.Heading(level));
            }
            textHeading(level, text) {
              return this.content.add(new heading_1.Heading(level).text(text));
            }
            mediaGroup() {
              return this.content.add(new media_group_1.MediaGroup());
            }
            orderedList() {
              return this.content.add(new ordered_list_1.OrderedList());
            }
            panel(type) {
              return this.content.add(new panel_1.Panel(type));
            }
            paragraph() {
              return this.content.add(new paragraph_1.Paragraph());
            }
            rule() {
              this.content.add(new rule_1.Rule());
              return this;
            }
            taskList(localId) {
              return this.content.add(new task_list_1.TaskList(localId));
            }
            toJSON() {
              return Object.assign({}, this.content.toJSON(), { version: this.attrs.version });
            }
            toString() {
              return JSON.stringify(this);
            }
          }
          exports2.Document = Document;
        })
      ),
      /***/
      804: (
        /***/
        (function(module2, __unusedexports, __webpack_require__) {
          const { marks, Text } = __webpack_require__(286);
          function attachTextToNodeSliceEmphasis(parentNode, textToEmphasis) {
            const lineUnderscored = textToEmphasis.replace(/\*/g, "_");
            let currentDecorationLevel = 0;
            let potentialUnderscorePair = false;
            let strikedThrough = false;
            let expressionBuffer = "";
            for (const currentCharacterIndex in lineUnderscored) {
              if (lineUnderscored[currentCharacterIndex] !== "_") {
                expressionBuffer += lineUnderscored[currentCharacterIndex];
                if (potentialUnderscorePair) {
                  currentDecorationLevel = currentDecorationLevel === 0 || currentDecorationLevel === 2 ? currentDecorationLevel + 1 : currentDecorationLevel - 1;
                  potentialUnderscorePair = false;
                }
              }
              if (currentCharacterIndex > 0 && lineUnderscored[currentCharacterIndex] === "~" && lineUnderscored[currentCharacterIndex - 1] === "~") {
                const textNode = new Text(
                  expressionBuffer.slice(0, expressionBuffer.length - 2),
                  convertDecorationLevelToMark(currentDecorationLevel, strikedThrough)
                );
                parentNode.content.add(textNode);
                expressionBuffer = "";
                strikedThrough = !strikedThrough;
              }
              if (lineUnderscored[currentCharacterIndex] === "_") {
                let decorationToUse = convertDecorationLevelToMark(currentDecorationLevel, strikedThrough);
                if (expressionBuffer !== "") {
                  const textNode = new Text(expressionBuffer, decorationToUse);
                  parentNode.content.add(textNode);
                } else {
                  if (potentialUnderscorePair)
                    currentDecorationLevel = currentDecorationLevel === 0 || currentDecorationLevel === 1 ? currentDecorationLevel + 2 : currentDecorationLevel - 2;
                }
                potentialUnderscorePair = !potentialUnderscorePair;
                expressionBuffer = "";
              }
            }
            if (expressionBuffer !== "") {
              const textNode = new Text(expressionBuffer, convertDecorationLevelToMark(currentDecorationLevel, strikedThrough));
              parentNode.content.add(textNode);
            }
          }
          function convertDecorationLevelToMark(decorationLevelToConvert, addStrikethrough) {
            if (addStrikethrough)
              return decorationLevelToConvert === 1 ? marks().strike().em() : decorationLevelToConvert === 2 ? marks().strike().strong() : decorationLevelToConvert === 3 ? marks().strike().strong().em() : marks().strike();
            return decorationLevelToConvert === 1 ? marks().em() : decorationLevelToConvert === 2 ? marks().strong() : decorationLevelToConvert === 3 ? marks().strong().em() : null;
          }
          module2.exports = attachTextToNodeSliceEmphasis;
        })
      ),
      /***/
      812: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const action_1 = __webpack_require__(620);
          const code_1 = __webpack_require__(601);
          const em_1 = __webpack_require__(400);
          const link_1 = __webpack_require__(206);
          const strike_1 = __webpack_require__(103);
          const strong_1 = __webpack_require__(192);
          const subsup_1 = __webpack_require__(396);
          const text_color_1 = __webpack_require__(936);
          const underline_1 = __webpack_require__(294);
          function marks() {
            return new Marks();
          }
          exports2.marks = marks;
          class Marks {
            constructor() {
              this.marks = [];
            }
            code() {
              return this.add(new code_1.Code());
            }
            em() {
              return this.add(new em_1.Em());
            }
            link(href, title) {
              return this.add(new link_1.Link(href, title));
            }
            strike() {
              return this.add(new strike_1.Strike());
            }
            strong() {
              return this.add(new strong_1.Strong());
            }
            sub() {
              return this.add(new subsup_1.SubSup("sub"));
            }
            sup() {
              return this.add(new subsup_1.SubSup("sup"));
            }
            color(color) {
              return this.add(new text_color_1.TextColor(color));
            }
            underline() {
              return this.add(new underline_1.Underline());
            }
            action(title, target, actionParameters) {
              return this.add(new action_1.Action(title, target, actionParameters));
            }
            toJSON() {
              if (this.marks.length === 0) {
                throw new Error("At least one mark is required");
              }
              return this.marks.map((mark) => mark.toJSON());
            }
            add(mark) {
              const existing = this.marks.filter((m) => m.type === mark.type);
              if (existing.length > 0) {
                throw new Error("A mark type can only be used once");
              }
              this.marks.push(mark);
              return this;
            }
          }
          exports2.Marks = Marks;
        })
      ),
      /***/
      823: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const index_1 = __webpack_require__(492);
          const media_1 = __webpack_require__(371);
          class MediaGroup extends index_1.TopLevelNode {
            constructor() {
              super(...arguments);
              this.content = new index_1.ContentNode("mediaGroup");
            }
            media(attrs) {
              this.content.add(new media_1.Media(attrs));
              return this;
            }
            link(id, collection) {
              this.content.add(new media_1.Media({ id, collection, type: "link" }));
              return this;
            }
            file(id, collection) {
              this.content.add(new media_1.Media({ id, collection, type: "file" }));
              return this;
            }
            toJSON() {
              return this.content.toJSON();
            }
          }
          exports2.MediaGroup = MediaGroup;
        })
      ),
      /***/
      849: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const index_1 = __webpack_require__(492);
          const list_item_1 = __webpack_require__(566);
          class BulletList extends index_1.TopLevelNode {
            constructor() {
              super(...arguments);
              this.content = new index_1.ContentNode("bulletList");
            }
            item() {
              return this.content.add(new list_item_1.ListItem());
            }
            textItem(text, marks) {
              this.item().paragraph().text(text, marks);
              return this;
            }
            linkItem(text, href, title) {
              this.item().paragraph().link(text, href, title);
              return this;
            }
            toJSON() {
              return this.content.toJSON();
            }
          }
          exports2.BulletList = BulletList;
        })
      ),
      /***/
      893: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const index_1 = __webpack_require__(492);
          const paragraph_1 = __webpack_require__(147);
          class BlockQuote extends index_1.TopLevelNode {
            constructor() {
              super(...arguments);
              this.content = new index_1.ContentNode("blockquote");
            }
            paragraph() {
              return this.content.add(new paragraph_1.Paragraph());
            }
            toJSON() {
              return this.content.toJSON();
            }
          }
          exports2.BlockQuote = BlockQuote;
        })
      ),
      /***/
      936: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const mark_1 = __webpack_require__(711);
          const colorPattern = /^#[0-9a-f]{6}$/;
          class TextColor extends mark_1.Mark {
            constructor(color) {
              super("textColor");
              this.color = color;
              if (!colorPattern.test(color)) {
                throw new Error(`Color ${color} does not match ^#[0-9a-f]{6}$`);
              }
            }
            toJSON() {
              return {
                type: this.type,
                attrs: {
                  color: this.color
                }
              };
            }
          }
          exports2.TextColor = TextColor;
        })
      ),
      /***/
      962: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const index_1 = __webpack_require__(492);
          function mention(id, text) {
            return new Mention(id, text);
          }
          exports2.mention = mention;
          class Mention extends index_1.InlineNode {
            constructor(id, text) {
              super();
              this.id = id;
              this.text = text;
            }
            toJSON() {
              return {
                type: "mention",
                attrs: {
                  id: this.id,
                  text: this.text
                }
              };
            }
          }
          exports2.Mention = Mention;
        })
      ),
      /***/
      976: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const task_1 = __webpack_require__(284);
          const index_1 = __webpack_require__(492);
          class TaskList extends index_1.TopLevelNode {
            constructor(localId) {
              super();
              this.localId = localId;
              this.content = new index_1.ContentNode("taskList");
            }
            task(localId, state) {
              return this.content.add(new task_1.Task(localId, state));
            }
            toJSON() {
              return Object.assign({}, this.content.toJSON(), { attrs: {
                localId: this.localId
              } });
            }
          }
          exports2.TaskList = TaskList;
        })
      ),
      /***/
      982: (
        /***/
        (function(__unusedmodule, exports2, __webpack_require__) {
          "use strict";
          Object.defineProperty(exports2, "__esModule", { value: true });
          const index_1 = __webpack_require__(492);
          const list_item_1 = __webpack_require__(566);
          class OrderedList extends index_1.TopLevelNode {
            constructor() {
              super(...arguments);
              this.content = new index_1.ContentNode("orderedList");
            }
            item() {
              return this.content.add(new list_item_1.ListItem());
            }
            textItem(text, marks) {
              this.item().paragraph().text(text, marks);
              return this;
            }
            linkItem(text, href, title) {
              this.item().paragraph().link(text, href, title);
              return this;
            }
            toJSON() {
              return this.content.toJSON();
            }
          }
          exports2.OrderedList = OrderedList;
        })
      )
      /******/
    });
  }
});

// src/lib/jira-client.ts
var import_md_to_adf = __toESM(require_dist(), 1);
async function jiraFetch(creds, path, opts = {}) {
  const auth = Buffer.from(`${creds.email}:${creds.token}`).toString("base64");
  const res = await fetch(`https://${creds.domain}${path}`, {
    ...opts,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...opts.headers ?? {}
    }
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text);
      msg = parsed.errorMessages?.[0] ?? parsed.message ?? text;
    } catch {
    }
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : null;
}
async function getTransitions(creds, key) {
  const data = await jiraFetch(creds, `/rest/api/3/issue/${key}/transitions`);
  return (data?.transitions ?? []).map((t) => ({ id: t.id, name: t.name, to: t.to?.name ?? "" }));
}
async function transitionIssue(creds, key, transitionId, comment) {
  const payload = { transition: { id: transitionId } };
  if (comment) {
    payload.update = {
      comment: [{ add: { body: (0, import_md_to_adf.default)(comment) } }]
    };
  }
  await jiraFetch(creds, `/rest/api/3/issue/${key}/transitions`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return { ok: true, key };
}

// src/cli/bulk-transition.ts
function loadCredsFromEnv() {
  const domain = process.env.JIRA_DOMAIN ?? "";
  const email = process.env.JIRA_EMAIL ?? "";
  const token = process.env.JIRA_TOKEN ?? "";
  if (!domain || !email || !token) {
    console.error("Missing credentials. Set JIRA_DOMAIN, JIRA_EMAIL, JIRA_TOKEN env vars.");
    process.exit(1);
  }
  return { domain, email, token };
}
function parseArgs(argv) {
  const args = { issues: [] };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--help":
        args.help = true;
        break;
      case "--to":
        args.to = argv[++i];
        break;
      case "--issue":
        args.issues.push(argv[++i]);
        break;
      case "--jql":
        args.jql = argv[++i];
        break;
    }
  }
  return args;
}
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log("Usage: node cli/bulk-transition.js --to <STATUS> [--issue <KEY> ...] [--jql <query>]");
    return;
  }
  if (!opts.to) {
    console.error("Error: --to is required.");
    process.exit(1);
  }
  if (!opts.issues.length && !opts.jql) {
    console.error("Error: provide --issue or --jql.");
    process.exit(1);
  }
  const creds = loadCredsFromEnv();
  let keys = [...opts.issues];
  if (opts.jql) {
    const data = await jiraFetch(creds, "/rest/api/3/search/jql", {
      method: "POST",
      body: JSON.stringify({ jql: opts.jql, fields: ["summary"], maxResults: 1e3 })
    });
    const jqlKeys = (data?.issues ?? []).map((i) => i.key);
    keys = [.../* @__PURE__ */ new Set([...keys, ...jqlKeys])];
  }
  if (keys.length === 0) {
    console.log("No issues found.");
    return;
  }
  console.log(`Transitioning ${keys.length} issue(s) to "${opts.to}"...
`);
  let updated = 0;
  for (const key of keys) {
    try {
      const transitions = await getTransitions(creds, key);
      const match = transitions.find((t) => t.name.toLowerCase() === opts.to.toLowerCase());
      if (!match) {
        console.error(`  Skipped ${key}: no transition "${opts.to}"`);
        continue;
      }
      await transitionIssue(creds, key, match.id);
      console.log(`  ${key} \u2192 ${opts.to}`);
      updated++;
    } catch (err) {
      console.error(`  Failed ${key}: ${err.message}`);
    }
  }
  console.log(`
Done. Transitioned ${updated}/${keys.length} issue(s).`);
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
