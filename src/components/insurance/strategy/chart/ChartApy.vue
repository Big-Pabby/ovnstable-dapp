<template>
    <div class="apy-chart-container">
        <v-row class="chart-header-row">
            <v-col cols="8">
                <v-row justify="start" align="center">
                    <label class="chart-title">{{ (avgApy && avgApy.value) ? ((isMobile ? 'Insurance' : 'Insurance daily net') + '&nbsp;') : ''}}</label>
                    <label class="chart-title" style="margin-left: 0 !important">
                        <abbr title="Annual Percentage Yield">APY</abbr>
                    </label>
                    <div class="mt-7 ml-1">
                        <Tooltip :size="16" text="Overnight retains part of the yield. APY figure is net of those retentions. You see what you get."/>
                    </div>
                </v-row>

                <v-row justify="start">
                    <label class="mobile-info-title">
                        {{ (avgApy && avgApy.value) ? (avgApy.value > 500 ? '>500' : $utils.formatMoneyComma(avgApy.value, 1)) + '%' : '' }}
                    </label>
                </v-row>

                <v-row justify="start" v-if="!isMobile">
                    <v-checkbox
                        class="hold-checkbox"
                        color="#22ABAC"
                        @click="redraw"
                        v-model="usdPlusDataEnabled"
                    >
                        <template v-slot:label>
                            <label class="hold-checkbox-label">USD+ APY</label>
                        </template>
                    </v-checkbox>
                </v-row>
            </v-col>

            <v-col class="add-chart-info-col">
                <v-row justify="end">
                    <label class="chart-title-apy">
                        {{ (avgApy && avgApy.value) ? (avgApy.value > 500 ? '>500' : $utils.formatMoneyComma(avgApy.value, 1)) + '%' : '' }}
                    </label>
                </v-row>
                <v-row justify="end">
                    <label class="chart-sub-title-apy">
                        {{ (avgApy && avgApy.date) ? 'from ' + avgApy.date : '' }}
                    </label>
                </v-row>
            </v-col>
        </v-row>

        <div class="chart-row" id="line-chart-apy"></div>

        <v-row class="zoom-row" style="margin-top: -40px !important;">
            <v-spacer></v-spacer>
            <v-btn
                text
                id="week-zoom-btn"
                class="zoom-btn"
                dark
                @click="zoomChart('week')"
            >
                <label>Week</label>
            </v-btn>
            <v-btn
                text
                id="month-zoom-btn"
                class="zoom-btn"
                dark
                @click="zoomChart('month')"
            >
                Month
            </v-btn>
            <v-btn
                text
                id="all-zoom-btn"
                class="zoom-btn mr-3"
                dark
                @click="zoomChart('all')"
            >
                All
            </v-btn>
        </v-row>

        <resize-observer @notify="$forceUpdate()"/>
    </div>
</template>

<script>
/* eslint-disable no-unused-vars,no-undef */

import {mapActions, mapGetters} from "vuex";
import moment from "moment";

import ApexCharts from 'apexcharts'
import Tooltip from "@/components/common/element/Tooltip";

export default {
    name: "ChartApy",

    props: {
        data: {
            type: Object,
            default: null,
        },

        usdPlusData: {
            type: Object,
            default: null,
        },

        insuranceData: {
            type: Object,
        },
    },

    watch: {
        data: function (newVal, oldVal) {
            this.redraw();
        },

        light: function (newVal, oldVal) {
            this.redraw();
        },

        usdPlusData: function (newVal, oldVal) {
            this.redraw();
        },
    },

    components: {Tooltip},

    data: () => ({
        zoom: "month",
        slice: null,
        chart: null,

        avgApy: null,
        usdPlusDataEnabled: true,
    }),

    computed: {
        ...mapGetters('network', ['polygonApi', 'bscApi', 'opApi', 'avaxApi']),
        ...mapGetters('theme', ['light']),

        isMobile() {
            return window.innerWidth < 650;
        }
    },

    mounted() {
        this.redraw();
    },

    created() {
        this.zoomChart("month");
    },

    methods: {
        async zoomChart(zoom) {

            let apiUrl;

            switch (this.insuranceData.chainId) {
                case 137:
                    apiUrl = this.polygonApi;
                    break;
                case 43114:
                    apiUrl = this.avaxApi;
                    break;
                case 10:
                    apiUrl = this.opApi;
                    break;
                case 56:
                    apiUrl = this.bscApi;
                    break;
                default:
                    apiUrl = this.polygonApi;
                    break;
            }

            let fetchOptions = {
                headers: {
                    "Access-Control-Allow-Origin": apiUrl
                }
            };

            await fetch(apiUrl + '/insurance/avg-apy-info/' + zoom, fetchOptions)
                .then(value => value.json())
                .then(value => {
                    this.avgApy = value;

                    if (this.avgApy.date) {
                        this.avgApy.date = moment(this.avgApy.date).format("DD MMM. ‘YY");
                    }
                }).catch(reason => {
                    console.log('Error get data: ' + reason);
                })

            this.zoom = zoom;

            switch (zoom) {
                case "week":
                    this.slice = -7;
                    break;
                case "month":
                    this.slice = -30;
                    break;
                case "all":
                    this.slice = null;
                    break;
                default:
                    this.slice = null;
            }

            if (this.chart) {
                this.chart.destroy();
            }

            this.redraw();
        },

        changeZoomBtnStyle() {
            document.getElementById("week-zoom-btn").classList.remove("selected");
            document.getElementById("month-zoom-btn").classList.remove("selected");
            document.getElementById("all-zoom-btn").classList.remove("selected");

            document.getElementById(this.zoom + "-zoom-btn").classList.add("selected");
        },

        redraw() {
            if (this.chart) {
                this.chart.destroy();
            }

            this.changeZoomBtnStyle();

            let values = [];
            this.data.datasets[0].data.forEach(v => values.push(v));
            values = this.slice ? values.slice(this.slice) : values;

            let labels = [];
            this.data.labels.forEach(v => labels.push(v));
            labels = this.slice ? labels.slice(this.slice) : labels;

            let valuesUsdPlus = [];
            labels.forEach(v => valuesUsdPlus.push(this.usdPlusData[v] ? this.usdPlusData[v] : null));

            let averageValue = this.avgApy.value;

            let maxValue;
            try {

                if (this.usdPlusDataEnabled) {
                    let maxValueEts = Math.max.apply(Math, values);
                    let maxValueUsdPlus = Math.max.apply(Math, valuesUsdPlus);

                    maxValue = Math.max(maxValueEts, maxValueUsdPlus);
                } else {
                    maxValue = Math.max.apply(Math, values);
                }

                maxValue = Math.round(Math.ceil(maxValue / 10)) * 10;
            } catch (e) {
                maxValue = 50;
            }

            let minValue;
            try {

                if (this.usdPlusDataEnabled) {
                    let minValueEts = Math.min.apply(Math, values);
                    let minValueUsdPlus = Math.min.apply(Math, valuesUsdPlus);

                    minValue = Math.min(minValueEts, minValueUsdPlus);
                } else {
                    minValue = Math.min.apply(Math, values);
                }

                minValue = Math.min(Math.floor(Math.floor(minValue / 10)) * 10, 0);
            } catch (e) {
                minValue = 0;
            }

            let chartColor = this.$colorUtils.hexToRgb('#7944DA');

            let seriesList = [];

            seriesList.push(
                {
                    name: "Insurance APY",
                    data: values
                }
            );

            if (this.usdPlusDataEnabled) {
                seriesList.push(
                    {
                        name: "USD+ APY",
                        data: valuesUsdPlus
                    }
                );
            }

            let options = {
                series: seriesList,

                labels: labels,

                chart: {
                    type: 'area',
                    height: this.isMobile ? 100 : 230,

                    sparkline: {
                        enabled: false,
                    },

                    zoom: {
                        enabled: false
                    },

                    background: 'var(--secondary)',

                    toolbar: {
                        show: false
                    }
                },

                annotations: {
                    position: 'front',
                    yaxis: [{
                        y: averageValue,
                        strokeDashArray: 5,
                        borderColor: '#7944DA',
                        fillColor: '#7944DA',
                        label: {
                            show: false,
                        },
                        width: this.isMobile ? '0%' : (averageValue ? '100%' : '0%'),
                    }]
                },

                grid: {
                    show: false,
                },

                dataLabels: {
                    enabled: false
                },

                stroke: {
                    curve: 'straight',
                    width: this.isMobile ? 1 : 2,
                    colors: ['#7944DA', "#22ABAC"],
                },

                xaxis: {
                    type: 'category',

                    tickAmount: this.isMobile ? 6 : 10,
                    tickPlacement: 'between',

                    labels: {
                        show: false,
                    },

                    axisBorder: {
                        show: false,
                    },

                    axisTicks: {
                        show: false,
                    },
                },

                yaxis: {
                    opposite: false,

                    tickAmount: 5,
                    min: minValue,
                    max: maxValue,

                    labels: {
                        show: false,
                    },
                },

                tooltip: {
                    enabled: true,

                    y: {
                        formatter: function (val, opts) {
                            return val ? ((val === 500 ? '>500' : val) + '%') : '—';
                        },
                    },
                },

                legend: {
                    show: false,
                },

                colors: this.light ? [`rgba(${chartColor.r}, ${chartColor.g}, ${chartColor.b}, 0.3)`, 'rgba(34, 171, 172, 0.3)'] : ['#7944DA', '#0d4444'],

                theme: {
                    mode: this.light ? 'light' : 'dark',
                },

                fill: {
                    type: ['gradient', 'gradient'],

                    gradient: {
                        shade: 'light',
                        type: "vertical",
                        shadeIntensity: 0.2,
                        opacityFrom: 1,
                        opacityTo: 0,
                        stops: [0, 100],
                    },
                }
            };

            this.chart = new ApexCharts(document.querySelector("#line-chart-apy"), options);
            this.chart.render();
        },
    }
}
</script>

<style scoped>

/* mobile */
@media only screen and (max-width: 1400px) {

    .chart-title {
        margin-top: 30px !important;
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 24px;
    }

    .mobile-info-title {
        margin-top: 5px !important;
        z-index: 2 !important;
        font-style: normal;
        font-weight: 400;
        font-size: 24px;
        line-height: 28px;
    }

    .add-chart-info-col, .zoom-row {
        display: none !important;
    }

    .chart-row {
        margin-bottom: -10px !important;
    }

    .hold-checkbox-label {
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 20px;
    }

    .zoom-btn {
        font-size: 16px !important;
        line-height: 20px !important;
    }
}

@media only screen and (min-width: 1400px) {
    .chart-title {
        margin-top: 30px !important;
        font-style: normal;
        font-weight: 400;
        font-size: 24px;
        line-height: 28px;
    }

    .chart-title-apy {
        margin-top: 30px !important;
        font-style: normal;
        font-weight: 400;
        font-size: 40px;
        line-height: 42px;
    }

    .chart-sub-title-apy {
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 20px;
    }

    .mobile-info-title {
        display: none !important;
    }

    .zoom-row {
        height: 20px !important;
    }

    .chart-header-row {
        height: 150px !important;
    }

    .chart-row {
        height: 250px !important;
    }

    .apy-chart-container {
        height: 420px !important;
    }

    .hold-checkbox-label {
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 20px;
    }

    .zoom-btn {
        font-size: 16px !important;
        line-height: 20px !important;
    }
}

@media
only screen and (-webkit-min-device-pixel-ratio: 2)      and (min-width: 1300px),
only screen and (   min--moz-device-pixel-ratio: 2)      and (min-width: 1300px),
only screen and (     -o-min-device-pixel-ratio: 2/1)    and (min-width: 1300px),
only screen and (        min-device-pixel-ratio: 2)      and (min-width: 1300px),
only screen and (                min-resolution: 192dpi) and (min-width: 1300px),
only screen and (                min-resolution: 2dppx)  and (min-width: 1300px) {
    .chart-title {
        margin-top: 30px !important;
        font-style: normal;
        font-weight: 400;
        font-size: 24px;
        line-height: 28px;
    }

    .chart-title-apy {
        margin-top: 30px !important;
        font-style: normal;
        font-weight: 400;
        font-size: 36px;
        line-height: 42px;
    }

    .chart-sub-title-apy {
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 20px;
    }

    .mobile-info-title {
        display: none !important;
    }

    .zoom-row {
        height: 50px !important;
    }

    .chart-header-row {
        height: 150px !important;
    }

    .chart-row {
        height: 300px !important;
    }

    .apy-chart-container {
        height: 420px !important;
    }

    .hold-checkbox-label {
        font-style: normal;
        font-weight: 400;
        font-size: 16px;
        line-height: 20px;
    }

    .zoom-btn {
        font-size: 15px !important;
        line-height: 20px !important;
    }
}

#line-chart-apy {
    overflow-x: hidden !important;
    overflow-y: hidden !important;
}

.yaxis-label {
    font-size: 12px !important;
    line-height: 12px !important;
    font-weight: 400;
    fill: rgba(255, 255, 255, 0.6) !important;
}

.zoom-btn {
    border: none !important;
    font-family: 'Roboto', sans-serif !important;
    font-style: normal !important;
    font-weight: 400 !important;
    letter-spacing: 0.02em !important;
    text-transform: uppercase !important;
    font-feature-settings: 'pnum' on, 'lnum' on !important;
    color: #707A8B !important;
}

.selected {
    color: var(--links-blue) !important;
    background-color: var(--selected-btn-color);
}

.yaxis-label {
    display: none !important;
}

.chart-header-row, .chart-row, .zoom-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
}

.chart-title {
    margin-left: 4%;
    font-family: 'Roboto', sans-serif;
    font-feature-settings: 'liga' off;
    color: var(--secondary-gray-text) !important;
}

.chart-title-apy {
    margin-right: 4%;
    font-family: 'Roboto', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on;
    color: var(--secondary-gray-text) !important;
}

.chart-sub-title-apy {
    margin-right: 4%;
    font-family: 'Roboto', sans-serif;
    font-feature-settings: 'liga' off;
    color: #707A8B !important;
}

.mobile-info-title {
    margin-left: 4%;
    font-family: 'Roboto', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on;
    color: var(--secondary-gray-text) !important;
}

.hold-checkbox, .hold-checkbox-label {
    z-index: 2 !important;
}

.hold-checkbox {
    margin-left: 4% !important;
}

.hold-checkbox-label {
    font-family: 'Roboto', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on;
    color: #707A8B !important;
}

</style>
