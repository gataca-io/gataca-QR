'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const BUILD = {};
const NAMESPACE = 'app';
function resetBuildConditionals(b) {
    Object.keys(b).forEach(key => {
        b[key] = true;
    });
    b.isDev = true;
    b.lazyLoad = true;
    b.member = true;
    b.reflect = true;
    b.scoped = true;
    b.shadowDom = true;
    b.slotRelocation = true;
    b.asyncLoading = true;
    b.svg = true;
    b.updatable = true;
    b.vdomAttribute = true;
    b.vdomXlink = true;
    b.vdomClass = true;
    b.vdomStyle = true;
    b.vdomKey = true;
    b.vdomRef = true;
    b.vdomListener = true;
    b.vdomFunctional = true;
    b.vdomText = true;
    b.allRenderFn = false;
    b.devTools = false;
    b.hydrateClientSide = false;
    b.hydrateServerSide = false;
}

exports.BUILD = BUILD;
exports.NAMESPACE = NAMESPACE;
exports.resetBuildConditionals = resetBuildConditionals;
