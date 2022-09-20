const state = {

    balance: {
        usdPlus: 0,
        asset: 0,
        wUsdPlus: 0,
        usdPlusWmatic: 0,
        wmaticUsdc: 0,
        etsMoonstone: 0,
        usdPlusWbnb: 0,
        busdWbnb: 0,
        etsRuby: 0,
    },

    account: null,

    uns: null,
};

const getters = {

    balance(state) {
        return state.balance;
    },

    account(state) {
        return state.account;
    },

    uns(state) {
        return state.uns;
    }

};

const actions = {

    async resetBalance({commit, dispatch, getters}) {

        console.debug('AccountData: resetBalance');

        commit('setBalance', {
            usdPlus: 0,
            asset: 0,
            wUsdPlus: 0,
            usdPlusWmatic: 0,
            wmaticUsdc: 0,
            etsMoonstone: 0,
            usdPlusWbnb: 0,
            busdWbnb: 0,
            etsRuby: 0,
        });

    },

    async resetUns({commit, dispatch, getters}) {

        console.debug('AccountData: resetUns');

        commit('setUns', null);
    },


    async refreshBalance({commit, dispatch, getters, rootState}) {

        console.debug('AccountData: refreshBalance');

        if (getters.account === null || getters.account === undefined){
            return;
        }

        commit('accountUI/setLoadingBalance', true, { root: true })
        let web3 = rootState.web3;

        let networkId = rootState.network.networkId;
        let assetDecimals = rootState.network.assetDecimals;

        let usdPlus;
        let asset;
        let wUsdPlus;
        let usdPlusWmatic;
        let wmaticUsdc;
        let etsMoonstone;
        let usdPlusWbnb;
        let busdWbnb;
        let etsRuby;

        try {
            asset = await web3.contracts.asset.methods.balanceOf(getters.account).call();
        } catch (e) {
        }

        try {
            usdPlus = await web3.contracts.usdPlus.methods.balanceOf(getters.account).call();
        } catch (e) {
        }

        if (networkId === 137 || networkId === 10) {
            try {
                wUsdPlus = await web3.contracts.wUsdPlus.methods.balanceOf(getters.account).call();
            } catch (e) {
            }
        }

        if (web3.contracts.usdPlusWmatic && networkId === 137) {
            try {
                usdPlusWmatic = await web3.contracts.usdPlusWmatic.methods.balanceOf(getters.account).call();
            } catch (e) {
            }
        }

        if (web3.contracts.wmaticUsdc && networkId === 137) {
            try {
                wmaticUsdc = await web3.contracts.wmaticUsdc.methods.balanceOf(getters.account).call();
            } catch (e) {
            }
        }

        if (web3.contracts.etsMoonstoneToken && networkId === 137) {
            try {
                etsMoonstone = await web3.contracts.etsMoonstoneToken.methods.balanceOf(getters.account).call();
            } catch (e) {
            }
        }

        if (web3.contracts.usdPlusWbnb && networkId === 56) {
            try {
                usdPlusWbnb = await web3.contracts.usdPlusWbnb.methods.balanceOf(getters.account).call();
            } catch (e) {
            }
        }

        if (web3.contracts.busdWbnb && networkId === 56) {
            try {
                busdWbnb = await web3.contracts.busdWbnb.methods.balanceOf(getters.account).call();
            } catch (e) {
            }
        }

        if (web3.contracts.etsRubyToken && networkId === 137) {
            try {
                etsRuby = await web3.contracts.etsRubyToken.methods.balanceOf(getters.account).call();
            } catch (e) {
            }
        }

        usdPlus = web3.web3.utils.fromWei(usdPlus, 'mwei') ;

        if (usdPlusWmatic && networkId === 137) {
            usdPlusWmatic = web3.web3.utils.fromWei(usdPlusWmatic, 'mwei') ;
        }

        if (wmaticUsdc && networkId === 137) {
            wmaticUsdc = web3.web3.utils.fromWei(wmaticUsdc, 'mwei') ;
        }

        if (etsMoonstone && networkId === 137) {
            etsMoonstone = web3.web3.utils.fromWei(etsMoonstone, 'mwei') ;
        }

        if (usdPlusWbnb && networkId === 56) {
            usdPlusWbnb = web3.web3.utils.fromWei(usdPlusWbnb, 'mwei') ;
        }

        if (busdWbnb && networkId === 56) {
            busdWbnb = web3.web3.utils.fromWei(busdWbnb, 'mwei') ;
        }

        if (assetDecimals === 18) {
            asset = web3.web3.utils.fromWei(asset, 'ether') ;
        } else {
            asset = web3.web3.utils.fromWei(asset, 'mwei') ;
        }

        if (wUsdPlus && (networkId === 137 || networkId === 10)) {
            wUsdPlus = web3.web3.utils.fromWei(wUsdPlus, 'mwei') ;
        }

        if (etsRuby && networkId === 10) {
            etsRuby = web3.web3.utils.fromWei(etsRuby, 'mwei') ;
        }

        commit('setBalance', {
            usdPlus: usdPlus,
            asset: asset,
            wUsdPlus: wUsdPlus,
            usdPlusWmatic: usdPlusWmatic,
            wmaticUsdc: wmaticUsdc,
            etsMoonstone: etsMoonstone,
            usdPlusWbnb: usdPlusWbnb,
            busdWbnb: busdWbnb,
            etsRuby: etsRuby,
        })

        commit('accountUI/setLoadingBalance', false, { root: true })
    },
};

const mutations = {

    setBalance(state, balance) {
        state.balance = balance;
    },

    setAccount(state, account) {
        state.account = account;
    },

    setUns(state, uns) {
        state.uns = uns;
    }
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
