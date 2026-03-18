"use strict";
/**
 * @file ide-adapters/index.ts
 * @description Returns the correct IdeAdapter for the current IDE.
 *
 * To add support for a new IDE:
 *   1. Create a new file, e.g. trae.ts, implementing IdeAdapter.
 *   2. Add a detection branch below (check vscode.env.appName).
 *   3. That's it — extension.ts needs no changes.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIdeAdapter = getIdeAdapter;
const vscode = __importStar(require("vscode"));
const cursor_1 = require("./cursor");
const vscode_1 = require("./vscode");
function getIdeAdapter() {
    const appName = (vscode.env.appName ?? '').toLowerCase();
    if (appName.includes('cursor'))
        return new cursor_1.CursorAdapter();
    // Add new IDEs here:
    // if (appName.includes('trae')) return new TraeAdapter();
    return new vscode_1.VsCodeAdapter();
}
//# sourceMappingURL=index.js.map