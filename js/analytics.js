/* =========================================================
   SERVICEHUB - ANALYTICS
   FRONTEND / MOCK BACKEND READY
   ========================================================= */

(function () {

    "use strict";


    const state = {
        user: null,
        period: 30,
        analytics: null
    };


    const $ = (id) =>
        document.getElementById(id);


    function unwrapData(response) {

        if (!response) {
            return null;
        }

        if (response.data !== undefined) {
            return response.data;
        }

        return response;
    }


    function firstDefined(...values) {

        for (const value of values) {

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                return value;
            }

        }

        return null;
    }


    function getInitials(name) {

        const value =
            String(name || "User").trim();

        if (!value) {
            return "U";
        }

        const parts =
            value.split(/\s+/);

        if (parts.length === 1) {
            return parts[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();

    }


    function showAlert(message, type = "success") {

        const container =
            $("analyticsAlert");

        if (!container) {
            return;
        }

        container.innerHTML = `

            <div
                class="alert alert-${type} alert-dismissible fade show"
                role="alert"
            >
                ${message}

                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                ></button>
            </div>

        `;

    }


    /* =====================================================
       USER
    ====================================================== */

    async function loadUser() {

        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.getCurrentUser === "function"
            ) {

                const result =
                    await ServiceHubAPI.getCurrentUser();

                if (result) {
                    state.user =
                        unwrapData(result);
                }

            }

        } catch (error) {

            console.warn(
                "Analytics API user lookup failed.",
                error
            );

        }


        if (!state.user) {

            try {

                if (
                    window.ServiceHubAuth &&
                    typeof ServiceHubAuth.getCurrentUser === "function"
                ) {

                    state.user =
                        await ServiceHubAuth.getCurrentUser();

                }

            } catch (error) {

                console.warn(
                    "Analytics auth lookup failed.",
                    error
                );

            }

        }


        if (!state.user) {

            window.location.href =
                "./login.html";

            return false;
        }


        return true;

    }


    function renderUser() {

        const user =
            state.user || {};

        const name =
            firstDefined(
                user.fullName,
                user.full_name,
                user.name,
                user.email,
                "User"
            );

        const role =
            firstDefined(
                user.role,
                user.accountType,
                user.account_type,
                "Service Provider"
            );


        const initials =
            getInitials(name);


        if ($("sidebarUserName")) {
            $("sidebarUserName").textContent =
                name;
        }

        if ($("sidebarUserType")) {
            $("sidebarUserType").textContent =
                role;
        }

        if ($("sidebarUserAvatar")) {
            $("sidebarUserAvatar").textContent =
                initials;
        }

        if ($("topbarUserName")) {
            $("topbarUserName").textContent =
                name;
        }

        if ($("topbarAvatar")) {
            $("topbarAvatar").textContent =
                initials;
        }

    }


    /* =====================================================
       MOCK DATA
    ====================================================== */

    function createMockAnalytics(period) {

        let labels;
        let values;

        if (period <= 7) {

            labels = [
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun"
            ];

            values = [
                32,
                45,
                38,
                61,
                54,
                72,
                67
            ];

        } else if (period <= 30) {

            labels = [
                "Week 1",
                "Week 2",
                "Week 3",
                "Week 4"
            ];

            values = [
                118,
                164,
                143,
                212
            ];

        } else if (period <= 90) {

            labels = [
                "Month 1",
                "Month 2",
                "Month 3"
            ];

            values = [
                410,
                535,
                681
            ];

        } else {

            labels = [
                "Oct",
                "Nov",
                "Dec",
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep"
            ];

            values = [
                180,
                230,
                280,
                310,
                355,
                390,
                420,
                470,
                510,
                560,
                620,
                681
            ];

        }


        return {

            profileViews:
                period <= 7 ? 339 :
                period <= 30 ? 637 :
                period <= 90 ? 1626 :
                5006,

            serviceClicks:
                period <= 7 ? 118 :
                period <= 30 ? 226 :
                period <= 90 ? 581 :
                1840,

            workViews:
                period <= 7 ? 94 :
                period <= 30 ? 184 :
                period <= 90 ? 470 :
                1510,

            contacts:
                period <= 7 ? 31 :
                period <= 30 ? 67 :
                period <= 90 ? 168 :
                530,

            labels,
            values,

            trafficSources: [
                {
                    name: "Direct Link",
                    icon: "bi-link-45deg",
                    percentage: 42
                },
                {
                    name: "ServiceHub Search",
                    icon: "bi-search",
                    percentage: 31
                },
                {
                    name: "Social Media",
                    icon: "bi-share-fill",
                    percentage: 18
                },
                {
                    name: "Other",
                    icon: "bi-three-dots",
                    percentage: 9
                }
            ],

            services: [
                {
                    name: "Logo Design",
                    views: 142
                },
                {
                    name: "Brand Identity",
                    views: 119
                },
                {
                    name: "Flyer Design",
                    views: 87
                },
                {
                    name: "Social Media Design",
                    views: 64
                }
            ],

            work: [
                {
                    name: "Restaurant Branding",
                    views: 96
                },
                {
                    name: "Business Logo",
                    views: 81
                },
                {
                    name: "Event Flyer",
                    views: 63
                },
                {
                    name: "Social Media Campaign",
                    views: 48
                }
            ],

            averageRating: 4.8,

            reviewCount: 12

        };

    }


    /* =====================================================
       LOAD ANALYTICS
    ====================================================== */

    async function loadAnalytics() {

        let data = null;


        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.getAnalytics === "function"
            ) {

                const result =
                    await ServiceHubAPI.getAnalytics();

                data =
                    unwrapData(result);

            }

        } catch (error) {

            console.warn(
                "Analytics API unavailable. Using mock data.",
                error
            );

        }


        if (!data) {
            data =
                createMockAnalytics(
                    state.period
                );
        }


        state.analytics = data;


        renderAnalytics();

    }


    /* =====================================================
       RENDER
    ====================================================== */

    function renderAnalytics() {

        const data =
            state.analytics ||
            createMockAnalytics(
                state.period
            );


        const profileViews =
            Number(
                firstDefined(
                    data.profileViews,
                    data.profile_views,
                    data.views,
                    0
                )
            );

        const serviceClicks =
            Number(
                firstDefined(
                    data.serviceClicks,
                    data.service_clicks,
                    0
                )
            );

        const workViews =
            Number(
                firstDefined(
                    data.workViews,
                    data.work_views,
                    0
                )
            );

        const contacts =
            Number(
                firstDefined(
                    data.contacts,
                    data.contactClicks,
                    data.contact_clicks,
                    0
                )
            );


        setText(
            "profileViews",
            profileViews.toLocaleString()
        );

        setText(
            "serviceClicks",
            serviceClicks.toLocaleString()
        );

        setText(
            "workViews",
            workViews.toLocaleString()
        );

        setText(
            "contactClicks",
            contacts.toLocaleString()
        );


        setText(
            "profileViewsChange",
            "+12.4% from previous period"
        );

        setText(
            "serviceClicksChange",
            "+8.7% from previous period"
        );

        setText(
            "workViewsChange",
            "+15.2% from previous period"
        );

        setText(
            "contactClicksChange",
            "+6.3% from previous period"
        );


        const total =
            Array.isArray(data.values)
                ? data.values.reduce(
                    (sum, value) =>
                        sum + Number(value || 0),
                    0
                )
                : profileViews;


        setText(
            "chartTotal",
            `${total.toLocaleString()} views`
        );


        renderChart(
            data.labels || [],
            data.values || []
        );


        renderTrafficSources(
            data.trafficSources || []
        );


        renderRanking(
            "serviceRanking",
            data.services || []
        );


        renderRanking(
            "workRanking",
            data.work || []
        );


        const serviceConversion =
            profileViews
                ? (serviceClicks / profileViews) * 100
                : 0;


        const contactConversion =
            profileViews
                ? (contacts / profileViews) * 100
                : 0;


        setText(
            "serviceConversion",
            `${serviceConversion.toFixed(1)}%`
        );

        setText(
            "contactConversion",
            `${contactConversion.toFixed(1)}%`
        );


        setText(
            "averageRating",
            Number(
                firstDefined(
                    data.averageRating,
                    data.average_rating,
                    0
                )
            ).toFixed(1)
        );


        setText(
            "reviewCount",
            Number(
                firstDefined(
                    data.reviewCount,
                    data.review_count,
                    0
                )
            ).toLocaleString()
        );

    }


    function setText(id, value) {

        if ($(id)) {
            $(id).textContent = value;
        }

    }


    /* =====================================================
       CHART
    ====================================================== */

    function renderChart(labels, values) {

        const canvas =
            $("activityChart");

        if (!canvas) {
            return;
        }


        const context =
            canvas.getContext("2d");

        const width =
            canvas.width =
                canvas.offsetWidth *
                window.devicePixelRatio;

        const height =
            canvas.height =
                canvas.offsetHeight *
                window.devicePixelRatio;


        context.scale(
            window.devicePixelRatio,
            window.devicePixelRatio
        );


        const drawWidth =
            canvas.offsetWidth;

        const drawHeight =
            canvas.offsetHeight;


        context.clearRect(
            0,
            0,
            drawWidth,
            drawHeight
        );


        if (!values.length) {
            return;
        }


        const max =
            Math.max(
                ...values.map(Number),
                1
            );


        const padding = {
            top: 20,
            right: 15,
            bottom: 35,
            left: 40
        };


        const chartWidth =
            drawWidth -
            padding.left -
            padding.right;

        const chartHeight =
            drawHeight -
            padding.top -
            padding.bottom;


        /* GRID */

        context.lineWidth = 1;
        context.strokeStyle = "#eee8dc";


        for (let i = 0; i <= 4; i++) {

            const y =
                padding.top +
                (chartHeight / 4) * i;


            context.beginPath();

            context.moveTo(
                padding.left,
                y
            );

            context.lineTo(
                drawWidth - padding.right,
                y
            );

            context.stroke();

        }


        /* LINE */

        const points =
            values.map(
                (value, index) => {

                    const x =
                        padding.left +
                        (
                            labels.length === 1
                                ? chartWidth / 2
                                : index /
                                    (labels.length - 1)
                                    * chartWidth
                        );

                    const y =
                        padding.top +
                        chartHeight -
                        (
                            Number(value) / max
                        ) *
                        chartHeight;


                    return {
                        x,
                        y
                    };

                }
            );


        context.beginPath();

        points.forEach(
            (point, index) => {

                if (index === 0) {

                    context.moveTo(
                        point.x,
                        point.y
                    );

                } else {

                    context.lineTo(
                        point.x,
                        point.y
                    );

                }

            }
        );


        context.lineWidth = 3;
        context.strokeStyle = "#c6a15b";
        context.stroke();


        /* POINTS */

        points.forEach(point => {

            context.beginPath();

            context.arc(
                point.x,
                point.y,
                4,
                0,
                Math.PI * 2
            );

            context.fillStyle = "#171717";
            context.fill();

            context.beginPath();

            context.arc(
                point.x,
                point.y,
                2,
                0,
                Math.PI * 2
            );

            context.fillStyle = "#c6a15b";
            context.fill();

        });


        /* LABELS */

        context.fillStyle = "#77736b";
        context.font = "11px Arial";
        context.textAlign = "center";


        labels.forEach(
            (label, index) => {

                const point =
                    points[index];

                context.fillText(
                    label,
                    point.x,
                    drawHeight - 10
                );

            }
        );

    }


    /* =====================================================
       TRAFFIC SOURCES
    ====================================================== */

    function renderTrafficSources(sources) {

        const container =
            $("trafficSourceList");

        if (!container) {
            return;
        }


        container.innerHTML = "";


        sources.forEach(source => {

            const item =
                document.createElement("div");

            item.className =
                "traffic-source-item";


            item.innerHTML = `

                <div class="traffic-source-icon">
                    <i class="bi ${source.icon || "bi-link"}"></i>
                </div>

                <div>

                    <div class="traffic-source-name">
                        ${source.name}
                    </div>

                    <div class="traffic-source-bar">

                        <div
                            class="traffic-source-fill"
                            style="width:${Number(
                                source.percentage || 0
                            )}%"
                        ></div>

                    </div>

                </div>

                <div class="traffic-source-percent">
                    ${Number(
                        source.percentage || 0
                    )}%
                </div>

            `;


            container.appendChild(item);

        });

    }


    /* =====================================================
       RANKINGS
    ====================================================== */

    function renderRanking(id, items) {

        const container =
            $(id);

        if (!container) {
            return;
        }


        container.innerHTML = "";


        if (!items.length) {

            container.innerHTML = `
                <div class="text-muted small">
                    No data available yet.
                </div>
            `;

            return;
        }


        items.forEach(
            (item, index) => {

                const row =
                    document.createElement("div");

                row.className =
                    "ranking-item";


                row.innerHTML = `

                    <div class="ranking-number">
                        ${index + 1}
                    </div>

                    <div>

                        <div class="ranking-name">
                            ${item.name || "Item"}
                        </div>

                        <div class="ranking-meta">
                            Portfolio activity
                        </div>

                    </div>

                    <div class="ranking-value">
                        ${Number(
                            item.views || 0
                        ).toLocaleString()}
                    </div>

                `;


                container.appendChild(row);

            }
        );

    }


    /* =====================================================
       PERIOD
    ====================================================== */

    function setupPeriod() {

        const select =
            $("analyticsPeriod");

        if (!select) {
            return;
        }


        select.addEventListener(
            "change",
            async () => {

                state.period =
                    Number(select.value);

                state.analytics =
                    createMockAnalytics(
                        state.period
                    );


                await loadAnalytics();

            }
        );

    }


    /* =====================================================
       MOBILE
    ====================================================== */

    function setupMobileMenu() {

        const button =
            $("mobileMenuButton");

        const sidebar =
            $("sidebar");


        if (!button || !sidebar) {
            return;
        }


        button.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "show"
                );

            }
        );

    }


    /* =====================================================
       LOGOUT
    ====================================================== */

    async function logout() {

        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.logout === "function"
            ) {

                await ServiceHubAPI.logout();

            } else if (
                window.ServiceHubAuth &&
                typeof ServiceHubAuth.logout === "function"
            ) {

                await ServiceHubAuth.logout();

            }

        } catch (error) {

            console.warn(
                "Logout error:",
                error
            );

        }


        window.location.href =
            "./login.html";

    }


    /* =====================================================
       RESIZE
    ====================================================== */

    function setupResize() {

        let timeout;

        window.addEventListener(
            "resize",
            () => {

                clearTimeout(timeout);

                timeout =
                    setTimeout(
                        () => {

                            if (state.analytics) {

                                renderChart(
                                    state.analytics.labels || [],
                                    state.analytics.values || []
                                );

                            }

                        },
                        150
                    );

            }
        );

    }


    /* =====================================================
       INIT
    ====================================================== */

    async function init() {

        const authenticated =
            await loadUser();

        if (!authenticated) {
            return;
        }


        renderUser();

        setupPeriod();

        setupMobileMenu();

        setupResize();


        $("logoutButton")?.addEventListener(
            "click",
            logout
        );


        await loadAnalytics();

    }


    window.ServiceHubAnalytics = {

        reload: loadAnalytics,

        getState: () => state

    };


    document.addEventListener(
        "DOMContentLoaded",
        init
    );

})();