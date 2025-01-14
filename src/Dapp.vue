<template>
    <div>
        <Navbar v-if="$wu.isFull()"/>
        <Header/>

        <v-main>
            <div class="main-container mt-5">
                <router-view></router-view>
            </div>
        </v-main>

        <AccountProfile width="760"/>
        <GasSettings width="510"/>

        <resize-observer @notify="$forceUpdate()"/>
    </div>
</template>

<script>

import Header from "./components/Header";
import AccountProfile from "./components/common/modal/account/AccountProfile";
import GasSettings from "@/components/common/modal/gas/GasSettings";
import {mapActions, mapGetters} from "vuex";
import Navbar from "@/components/Navbar";

export default {
    name: "Dapp",
    components: {
        Navbar,
        GasSettings,
        AccountProfile,
        Header
    },

    data: () => ({
        get showOvercapModal() {

            let showOvercapModal = localStorage.getItem('showOvercapModal');

            if (showOvercapModal == null) {
                localStorage.setItem('showOvercapModal', "true");
                showOvercapModal = localStorage.getItem('showOvercapModal');
            }

            return showOvercapModal === "true";
        },
    }),

    async created() {
        console.debug('Dapp created')

        await this.initTheme();

        await this.initEtsList();
        await this.getPoolList();

        await this.initWeb3();
        await this.dappInitWalletConnect();
        this.initReferralCode();

        this.$gtm.enable(true);
    },

    watch: {
        account: function (newVal, oldVal) {
            if (newVal && localStorage.getItem('overcapRemainingValue') === '-1') {
                localStorage.setItem('overcapRemainingValue', this.walletOvercapLimit.toString());
            }
        },
    },

    computed: {
        ...mapGetters('overcapData', ['isOvercapAvailable', 'showOvercapBanner', 'walletOvercapLimit']),
        ...mapGetters('accountData', ['account']),
        ...mapGetters('network', ['networkId']),
    },

    methods:{
        ...mapActions('web3', ['initWeb3']),
        ...mapActions('walletAction', ['dappInitWalletConnect']),
        ...mapActions('referral', ['initReferralCode']),
        ...mapActions('etsAction', ['initEtsList']),
        ...mapActions('poolAction', ['getPoolList']),
        ...mapActions('theme', ['initTheme']),
    }
}
</script>

<style scoped>

/* mobile */
@media only screen and (max-width: 960px) {
    .main-container {
        width: 95%;
        margin: auto;
    }
}

/* tablet */
@media only screen and (min-width: 960px) and (max-width: 1400px) {
    .main-container {
        width: 95%;
        margin: auto;
    }
}

/* full */
@media only screen and (min-width: 1400px) {
    .main-container {
        width: 90%;
        margin: auto;
    }
}

/* mac */
@media
only screen and (-webkit-min-device-pixel-ratio: 2)      and (min-width: 1300px),
only screen and (   min--moz-device-pixel-ratio: 2)      and (min-width: 1300px),
only screen and (     -o-min-device-pixel-ratio: 2/1)    and (min-width: 1300px),
only screen and (        min-device-pixel-ratio: 2)      and (min-width: 1300px),
only screen and (                min-resolution: 192dpi) and (min-width: 1300px),
only screen and (                min-resolution: 2dppx)  and (min-width: 1300px) {
    .main-container {
        width: 95%;
        margin: auto;
    }
}
</style>
