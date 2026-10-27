# ============================================================================
# REAL-TIME LOCATION REGISTRY: EXTENDED DISTRICTS & URBAN LOCALITIES
# RFC 7946 GeoJSON format (EPSG:4326 WGS84)
# Covers: Chennai, Coimbatore, Cuddalore, Tiruvannamalai, Madurai, Puducherry, Karaikal
# ============================================================================

KEY_DISTRICTS = [
    # ── Tamil Nadu (TN) ──
    {"code": "CHN", "name": "Chennai", "state_code": "TN", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707, "bbox": [12.91, 80.12, 13.24, 80.33], "area_sqkm": 426.0},
    {"code": "CBE", "name": "Coimbatore", "state_code": "TN", "state": "Tamil Nadu", "lat": 11.0168, "lon": 76.9558, "bbox": [10.20, 76.65, 11.50, 77.30], "area_sqkm": 4723.0},
    {"code": "CUD", "name": "Cuddalore", "state_code": "TN", "state": "Tamil Nadu", "lat": 11.7480, "lon": 79.7714, "bbox": [11.20, 79.15, 11.98, 79.85], "area_sqkm": 3703.0},
    {"code": "TVM", "name": "Tiruvannamalai", "state_code": "TN", "state": "Tamil Nadu", "lat": 12.2253, "lon": 79.0747, "bbox": [11.90, 78.60, 12.80, 79.60], "area_sqkm": 6188.0},
    {"code": "MDU", "name": "Madurai", "state_code": "TN", "state": "Tamil Nadu", "lat": 9.9252, "lon": 78.1198, "bbox": [9.60, 77.80, 10.30, 78.45], "area_sqkm": 3741.0},
    {"code": "KAP", "name": "Kanchipuram", "state_code": "TN", "state": "Tamil Nadu", "lat": 12.8342, "lon": 79.7036, "bbox": [12.45, 79.40, 13.05, 80.05], "area_sqkm": 4483.0},
    {"code": "TNJ", "name": "Thanjavur", "state_code": "TN", "state": "Tamil Nadu", "lat": 10.7870, "lon": 79.1378, "bbox": [10.20, 78.75, 11.15, 79.55], "area_sqkm": 3396.0},

    # ── Puducherry Union Territory (PY) ──
    {"code": "PDY", "name": "Puducherry Urban", "state_code": "PY", "state": "Puducherry", "lat": 11.9416, "lon": 79.8083, "bbox": [11.85, 79.75, 12.05, 79.88], "area_sqkm": 293.0},
    {"code": "KRK", "name": "Karaikal", "state_code": "PY", "state": "Puducherry", "lat": 10.9254, "lon": 79.8380, "bbox": [10.82, 79.76, 11.02, 79.88], "area_sqkm": 161.0},

    # ── Other Key National Monitored Districts ──
    {"code": "EKM", "name": "Ernakulam (Kochi)", "state_code": "KL", "state": "Kerala", "lat": 9.9816, "lon": 76.2999, "bbox": [9.75, 76.15, 10.25, 76.75], "area_sqkm": 3068.0},
    {"code": "WYD", "name": "Wayanad", "state_code": "KL", "state": "Kerala", "lat": 11.6854, "lon": 76.1320, "bbox": [11.45, 75.85, 12.00, 76.45], "area_sqkm": 2131.0},
    {"code": "KAM", "name": "Kamrup Metropolitan (Guwahati)", "state_code": "AS", "state": "Assam", "lat": 26.1445, "lon": 91.7362, "bbox": [25.95, 91.50, 26.35, 92.10], "area_sqkm": 1528.0},
    {"code": "CHM", "name": "Chamoli", "state_code": "UK", "state": "Uttarakhand", "lat": 30.4225, "lon": 79.3283, "bbox": [29.95, 78.85, 31.10, 80.15], "area_sqkm": 8030.0},
    {"code": "DL_C", "name": "Central Delhi", "state_code": "DL", "state": "Delhi", "lat": 28.6448, "lon": 77.2167, "bbox": [28.58, 77.16, 28.72, 77.28], "area_sqkm": 25.0}
]

ALL_MONITORED_NEIGHBORHOODS = [
    # =========================================================================
    # 1. CHENNAI (CHN)
    # =========================================================================
    {
        "id": "tnagar",
        "name": "T. Nagar (Thyagaraya Nagar)",
        "district": "Chennai",
        "district_code": "CHN",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [13.0418, 80.2341],
        "bbox": [13.0280, 80.2180, 13.0560, 80.2490],
        "area_sqkm": 4.85,
        "type": "neighborhood",
        "vulnerability_profile": "High commercial density, low-lying micro-depression draining into Mambalam canal; vulnerable to severe subway and street waterlogging.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [80.2200, 13.0300],
                [80.2450, 13.0300],
                [80.2480, 13.0450],
                [80.2420, 13.0550],
                [80.2250, 13.0540],
                [80.2190, 13.0420],
                [80.2200, 13.0300]
            ]]
        },
        "critical_facilities": [
            {"name": "T. Nagar Sub-Post Office & Postal Colony", "type": "Public Facility", "lat": 13.0402, "lon": 80.2315, "elevation_m": 6.8},
            {"name": "Corporation Urban Community Health Centre", "type": "Hospital", "lat": 13.0445, "lon": 80.2352, "elevation_m": 7.4},
            {"name": "Madley Subway Pump Station (GCC)", "type": "Dewatering Infrastructure", "lat": 13.0371, "lon": 80.2295, "elevation_m": 4.2}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-TN-01", "name": "Madley Subway", "lat": 13.0371, "lon": 80.2295, "water_depth_cm": 75, "status": "INUNDATED - CLOSED TO TRAFFIC", "pumps_active": 3, "capacity_hp": 300},
            {"id": "WL-TN-02", "name": "Bazullah Road Subway", "lat": 13.0468, "lon": 80.2398, "water_depth_cm": 42, "status": "WATERLOGGED - DIVERTED", "pumps_active": 2, "capacity_hp": 150}
        ],
        "nearest_aws": "IMD AWS YMCA Nandanam (Station ID: 43279)",
        "aws_distance_km": 1.4
    },
    {
        "id": "velachery",
        "name": "Velachery",
        "district": "Chennai",
        "district_code": "CHN",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [12.9815, 80.2180],
        "bbox": [12.9650, 80.2000, 12.9980, 80.2350],
        "area_sqkm": 6.20,
        "type": "neighborhood",
        "vulnerability_profile": "Located in natural Velachery Lake overflow catchment and Pallikaranai marsh fringe; high historical waterlogging depth during monsoon surplus.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [80.2020, 12.9700],
                [80.2300, 12.9680],
                [80.2340, 12.9850],
                [80.2280, 12.9970],
                [80.2100, 12.9950],
                [80.2010, 12.9820],
                [80.2020, 12.9700]
            ]]
        },
        "critical_facilities": [
            {"name": "Velachery Government Hospital", "type": "Hospital", "lat": 12.9805, "lon": 80.2195, "elevation_m": 5.8},
            {"name": "Guru Nanak College", "type": "Relief Centre / Shelter", "lat": 12.9910, "lon": 80.2215, "elevation_m": 6.9}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-VL-01", "name": "100 Feet Bypass Road / Vijayanagar Jn", "lat": 12.9785, "lon": 80.2190, "water_depth_cm": 48, "status": "WATERLOGGED - HEAVY SLOWDOWN", "pumps_active": 4, "capacity_hp": 350}
        ],
        "nearest_aws": "IMD AWS Sholinganallur / Perungudi",
        "aws_distance_km": 3.1
    },
    {
        "id": "adyar",
        "name": "Adyar & River Corridor",
        "district": "Chennai",
        "district_code": "CHN",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [13.0012, 80.2565],
        "bbox": [12.9850, 80.2400, 13.0180, 80.2750],
        "area_sqkm": 5.80,
        "type": "neighborhood",
        "vulnerability_profile": "Estuarine confluence of Adyar River and Bay of Bengal; prone to combined tidal storm surges, river mouth silt-choking, and Kotturpuram overbank inundation.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [80.2420, 12.9900],
                [80.2700, 12.9900],
                [80.2720, 13.0120],
                [80.2520, 13.0150],
                [80.2410, 13.0020],
                [80.2420, 12.9900]
            ]]
        },
        "critical_facilities": [
            {"name": "Fortis Malar Hospital", "type": "Critical Hospital", "lat": 13.0055, "lon": 80.2570, "elevation_m": 6.5}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-AD-01", "name": "Kotturpuram Riverbank Lowlands", "lat": 13.0210, "lon": 80.2430, "water_depth_cm": 52, "status": "RIVERINE SURCHARGE WARNING", "pumps_active": 3, "capacity_hp": 250}
        ],
        "nearest_aws": "IMD Meenambakkam Airport (Station ID: 43279)",
        "aws_distance_km": 5.2
    },
    {
        "id": "tambaram",
        "name": "Tambaram (Mudichur Corridor)",
        "district": "Chennai",
        "district_code": "CHN",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [12.9249, 80.1000],
        "bbox": [12.9050, 80.0750, 12.9450, 80.1300],
        "area_sqkm": 8.10,
        "type": "neighborhood",
        "vulnerability_profile": "Low-lying southern suburban gateway bordering Adyar River headwaters and Chembarambakkam surplus channel; vulnerable to heavy backwater pooling.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [80.0800, 12.9080],
                [80.1250, 12.9080],
                [80.1280, 12.9380],
                [80.0850, 12.9400],
                [80.0800, 12.9080]
            ]]
        },
        "critical_facilities": [
            {"name": "Tambaram Taluk Government Hospital", "type": "Hospital", "lat": 12.9230, "lon": 80.1180, "elevation_m": 16.5}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-TB-01", "name": "Mudichur Main Road Low Points", "lat": 12.9190, "lon": 80.0890, "water_depth_cm": 65, "status": "INUNDATED - SDRF BOATS ACTIVE", "pumps_active": 4, "capacity_hp": 300}
        ],
        "nearest_aws": "IMD Meenambakkam AWS",
        "aws_distance_km": 4.8
    },
    {
        "id": "mylapore",
        "name": "Mylapore & Buckingham Canal Corridor",
        "district": "Chennai",
        "district_code": "CHN",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [13.0368, 80.2676],
        "bbox": [13.0220, 80.2520, 13.0520, 80.2820],
        "area_sqkm": 4.10,
        "type": "neighborhood",
        "vulnerability_profile": "High density historic precinct along Buckingham Canal; tide-locked canal backwaters cause street level pooling in low-elevation residential blocks.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [80.2550, 13.0250],
                [80.2780, 13.0250],
                [80.2800, 13.0480],
                [80.2580, 13.0480],
                [80.2550, 13.0250]
            ]]
        },
        "critical_facilities": [
            {"name": "Mylapore Urban PHC", "type": "Healthcare", "lat": 13.0340, "lon": 80.2680, "elevation_m": 6.2}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-MY-01", "name": "Luz Church Road Junction", "lat": 13.0385, "lon": 80.2635, "water_depth_cm": 25, "status": "WATERLOGGED", "pumps_active": 2, "capacity_hp": 100}
        ],
        "nearest_aws": "IMD Nungambakkam AWS (Station ID: 43278)",
        "aws_distance_km": 3.8
    },

    # =========================================================================
    # 2. COIMBATORE (CBE)
    # =========================================================================
    {
        "id": "cbe_rspuram",
        "name": "R.S. Puram (Rathina Sabapathi Puram)",
        "district": "Coimbatore",
        "district_code": "CBE",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [11.0080, 76.9450],
        "bbox": [10.9950, 76.9320, 11.0210, 76.9580],
        "area_sqkm": 5.4,
        "type": "neighborhood",
        "vulnerability_profile": "Dense commercial-residential grid in western Coimbatore; sensitive to D.B. Road stormwater choke points and drainage overflow into Muthannankulam tank.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [76.9350, 10.9980],
                [76.9550, 10.9980],
                [76.9580, 11.0180],
                [76.9380, 11.0190],
                [76.9350, 10.9980]
            ]]
        },
        "critical_facilities": [
            {"name": "Coimbatore Corporation West Zone Office", "type": "Administration", "lat": 11.0075, "lon": 76.9460, "elevation_m": 418.0},
            {"name": "R.S. Puram Urban Primary Health Centre", "type": "Hospital", "lat": 11.0092, "lon": 76.9435, "elevation_m": 419.5}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-CBE-01", "name": "Diwan Bahadur (D.B.) Road Junction", "lat": 11.0085, "lon": 76.9440, "water_depth_cm": 35, "status": "SURFACE PONDING", "pumps_active": 2, "capacity_hp": 120}
        ],
        "nearest_aws": "IMD Coimbatore Agro AWS (TNAU)",
        "aws_distance_km": 2.1
    },
    {
        "id": "cbe_gandhipuram",
        "name": "Gandhipuram & Cross Cut Road Hub",
        "district": "Coimbatore",
        "district_code": "CBE",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [11.0185, 76.9680],
        "bbox": [11.0050, 76.9550, 11.0320, 76.9810],
        "area_sqkm": 4.8,
        "type": "neighborhood",
        "vulnerability_profile": "Central metropolitan transport and trade node; prone to Gandhipuram flyover sub-grade inundation and Dr. Nanjappa Road channel choke points.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [76.9580, 11.0080],
                [76.9780, 11.0080],
                [76.9800, 11.0280],
                [76.9600, 11.0290],
                [76.9580, 11.0080]
            ]]
        },
        "critical_facilities": [
            {"name": "Gandhipuram Central Bus Terminus", "type": "Transit Hub", "lat": 11.0175, "lon": 76.9675, "elevation_m": 415.0},
            {"name": "ESI Hospital & Medical College", "type": "Hospital", "lat": 11.0210, "lon": 76.9710, "elevation_m": 416.2}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-CBE-02", "name": "Cross Cut Road Subway", "lat": 11.0190, "lon": 76.9660, "water_depth_cm": 45, "status": "SUBWAY WATERLOGGED", "pumps_active": 3, "capacity_hp": 180}
        ],
        "nearest_aws": "IMD Coimbatore City Observatory",
        "aws_distance_km": 1.5
    },
    {
        "id": "cbe_peelamedu",
        "name": "Peelamedu IT Corridor & Avinashi Road",
        "district": "Coimbatore",
        "district_code": "CBE",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [11.0280, 77.0150],
        "bbox": [11.0120, 76.9950, 11.0440, 77.0350],
        "area_sqkm": 7.2,
        "type": "neighborhood",
        "vulnerability_profile": "Arterial IT and education strip traversing PSG tech hub; airport runway depression causes rainwater accumulation across low-elevation service lanes.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [76.9980, 11.0150],
                [77.0320, 11.0150],
                [77.0340, 11.0410],
                [77.0000, 11.0410],
                [76.9980, 11.0150]
            ]]
        },
        "critical_facilities": [
            {"name": "PSG Hospitals Emergency Trauma Centre", "type": "Hospital", "lat": 11.0255, "lon": 77.0125, "elevation_m": 411.0},
            {"name": "Coimbatore International Airport Station", "type": "Airport Infrastructure", "lat": 11.0300, "lon": 77.0430, "elevation_m": 403.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-CBE-03", "name": "Avinashi Road Peelamedu Junction", "lat": 11.0260, "lon": 77.0140, "water_depth_cm": 30, "status": "DRAINAGE RETENTION", "pumps_active": 2, "capacity_hp": 140}
        ],
        "nearest_aws": "IMD Coimbatore Airport AWS",
        "aws_distance_km": 2.8
    },
    {
        "id": "cbe_singanallur",
        "name": "Singanallur Lake Catchment & Trichy Road",
        "district": "Coimbatore",
        "district_code": "CBE",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [10.9980, 77.0250],
        "bbox": [10.9800, 77.0050, 11.0160, 77.0450],
        "area_sqkm": 8.5,
        "type": "neighborhood",
        "vulnerability_profile": "Biodiversity wetland fringe around Singanallur Lake; surplus inflows from Noyyal feeder canals inundate surrounding residential layouts and bus stand.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [77.0080, 10.9850],
                [77.0420, 10.9850],
                [77.0440, 11.0120],
                [77.0100, 11.0120],
                [77.0080, 10.9850]
            ]]
        },
        "critical_facilities": [
            {"name": "Singanallur Bus Terminal", "type": "Transit Hub", "lat": 10.9960, "lon": 77.0220, "elevation_m": 405.0},
            {"name": "Singanallur Lake Surplus Weir Channel", "type": "Flood Control", "lat": 10.9995, "lon": 77.0290, "elevation_m": 401.5}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-CBE-04", "name": "Trichy Road Singanallur Underpass", "lat": 10.9955, "lon": 77.0235, "water_depth_cm": 50, "status": "INUNDATED - RESTRICTED", "pumps_active": 3, "capacity_hp": 200}
        ],
        "nearest_aws": "IMD Coimbatore Airport AWS",
        "aws_distance_km": 3.9
    },
    {
        "id": "cbe_ukkadam",
        "name": "Ukkadam Big Tank (Periyakulam) Basin",
        "district": "Coimbatore",
        "district_code": "CBE",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [10.9900, 76.9600],
        "bbox": [10.9750, 76.9450, 11.0050, 76.9750],
        "area_sqkm": 6.8,
        "type": "neighborhood",
        "vulnerability_profile": "Major lake ecosystem receiving urban discharge; high water levels during northeast monsoon risk embankment overspill into highway corridors and market areas.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [76.9480, 10.9780],
                [76.9720, 10.9780],
                [76.9740, 11.0020],
                [76.9500, 11.0020],
                [76.9480, 10.9780]
            ]]
        },
        "critical_facilities": [
            {"name": "Ukkadam Bus Stand & Sewage Treatment Plant", "type": "Public Facility", "lat": 10.9880, "lon": 76.9620, "elevation_m": 412.0},
            {"name": "Periyakulam Lake Sluice Control Node", "type": "Water Resources", "lat": 10.9920, "lon": 76.9570, "elevation_m": 409.5}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-CBE-05", "name": "Ukkadam-Pollachi Road Junction", "lat": 10.9870, "lon": 76.9610, "water_depth_cm": 38, "status": "LAKE RUNOFF SURGE", "pumps_active": 2, "capacity_hp": 150}
        ],
        "nearest_aws": "IMD Coimbatore City Observatory",
        "aws_distance_km": 2.4
    },
    {
        "id": "cbe_noyyal",
        "name": "Noyyal River Corridor & Perur",
        "district": "Coimbatore",
        "district_code": "CBE",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [10.9700, 76.9150],
        "bbox": [10.9520, 76.8950, 10.9880, 76.9350],
        "area_sqkm": 9.6,
        "type": "neighborhood",
        "vulnerability_profile": "Historic riverine floodplain of the sacred Noyyal river; high river discharge from Siruvani hills causes agricultural and temple embankment overspill.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [76.8980, 10.9560],
                [76.9320, 10.9560],
                [76.9340, 10.9840],
                [76.9000, 10.9840],
                [76.8980, 10.9560]
            ]]
        },
        "critical_facilities": [
            {"name": "Perur Pateeswarar Temple Flood Wall", "type": "Heritage Protection", "lat": 10.9710, "lon": 76.9140, "elevation_m": 435.0},
            {"name": "Noyyal River Perur Anicut & Sluices", "type": "Irrigation Dam", "lat": 10.9680, "lon": 76.9180, "elevation_m": 432.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-CBE-06", "name": "Perur Causeway Bridge", "lat": 10.9695, "lon": 76.9165, "water_depth_cm": 60, "status": "RIVER SPATE OVERWASH", "pumps_active": 3, "capacity_hp": 200}
        ],
        "nearest_aws": "IMD Coimbatore Agro AWS (TNAU)",
        "aws_distance_km": 4.5
    },

    # =========================================================================
    # 3. CUDDALORE (CUD)
    # =========================================================================
    {
        "id": "cuddalore",
        "name": "Cuddalore Delta & Port Corridor",
        "district": "Cuddalore",
        "district_code": "CUD",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [11.7480, 79.7714],
        "bbox": [11.7000, 79.7200, 11.7900, 79.8100],
        "area_sqkm": 12.4,
        "type": "neighborhood",
        "vulnerability_profile": "Gadilam and Pennaiyar delta convergence; highly vulnerable to cyclonic storm surges and coastal riverine overbank flood discharges.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.7250, 11.7100],
                [79.8050, 11.7120],
                [79.8080, 11.7850],
                [79.7350, 11.7820],
                [79.7250, 11.7100]
            ]]
        },
        "critical_facilities": [
            {"name": "Cuddalore District Headquarter Government Hospital", "type": "Hospital", "lat": 11.7510, "lon": 79.7680, "elevation_m": 4.5},
            {"name": "Old Town Port Cyclone Shelter", "type": "Cyclone Shelter", "lat": 11.7380, "lon": 79.7760, "elevation_m": 3.8}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-CD-01", "name": "OT Beach Road", "lat": 11.7410, "lon": 79.7740, "water_depth_cm": 55, "status": "COASTAL SURGE WARNING", "pumps_active": 3, "capacity_hp": 250}
        ],
        "nearest_aws": "IMD AWS Cuddalore Port",
        "aws_distance_km": 1.8
    },
    {
        "id": "cuddalore_gadilam",
        "name": "Gadilam River Basin & Manjakuppam",
        "district": "Cuddalore",
        "district_code": "CUD",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [11.7580, 79.7550],
        "bbox": [11.7400, 79.7350, 11.7760, 79.7750],
        "area_sqkm": 5.8,
        "type": "neighborhood",
        "vulnerability_profile": "Administrative center of Cuddalore along Gadilam northern bank; heavy upstream releases from Kallanai/Vepur basins overflow into collectorate grounds.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.7380, 11.7440],
                [79.7720, 11.7440],
                [79.7740, 11.7720],
                [79.7400, 11.7720],
                [79.7380, 11.7440]
            ]]
        },
        "critical_facilities": [
            {"name": "Cuddalore District Collectorate Complex", "type": "Emergency Operations", "lat": 11.7560, "lon": 79.7530, "elevation_m": 7.5},
            {"name": "Manjakuppam Government Arts College Shelter", "type": "Relief Centre", "lat": 11.7610, "lon": 79.7580, "elevation_m": 8.2}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-CD-02", "name": "Sub-Jail Road Manjakuppam", "lat": 11.7570, "lon": 79.7540, "water_depth_cm": 42, "status": "RIVER OVERBANK FLOOD", "pumps_active": 2, "capacity_hp": 150}
        ],
        "nearest_aws": "IMD AWS Cuddalore Port",
        "aws_distance_km": 2.4
    },
    {
        "id": "cuddalore_pennaiyar",
        "name": "Pennaiyar Delta & Semmandalam",
        "district": "Cuddalore",
        "district_code": "CUD",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [11.7750, 79.7420],
        "bbox": [11.7550, 79.7200, 11.7950, 79.7640],
        "area_sqkm": 7.4,
        "type": "neighborhood",
        "vulnerability_profile": "Deltaic floodplain carrying Thenpennai river flood discharge from Sathanur Dam; sensitive to river embankment breach and low-lying agrarian submergence.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.7250, 11.7600],
                [79.7600, 11.7600],
                [79.7620, 11.7900],
                [79.7270, 11.7900],
                [79.7250, 11.7600]
            ]]
        },
        "critical_facilities": [
            {"name": "Semmandalam PWD Flood Regulating Station", "type": "Water Resources", "lat": 11.7730, "lon": 79.7400, "elevation_m": 6.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-CD-03", "name": "Pennaiyar Bund Road", "lat": 11.7760, "lon": 79.7440, "water_depth_cm": 50, "status": "DELTA OVERFLOW", "pumps_active": 2, "capacity_hp": 180}
        ],
        "nearest_aws": "IMD AWS Cuddalore Port",
        "aws_distance_km": 4.2
    },
    {
        "id": "cuddalore_chidambaram",
        "name": "Chidambaram (Nataraja Temple Basin)",
        "district": "Cuddalore",
        "district_code": "CUD",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [11.3990, 79.6930],
        "bbox": [11.3800, 79.6700, 11.4180, 79.7160],
        "area_sqkm": 8.2,
        "type": "neighborhood",
        "vulnerability_profile": "Historic temple town in low Coleroon-Vellar delta; Khan Sahib canal overflow and Sivaganga sacred tank backwater inundate surrounding streets.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.6750, 11.3850],
                [79.7120, 11.3850],
                [79.7140, 11.4130],
                [79.6770, 11.4130],
                [79.6750, 11.3850]
            ]]
        },
        "critical_facilities": [
            {"name": "Rajah Muthiah Medical College & Hospital", "type": "Hospital", "lat": 11.3910, "lon": 79.7120, "elevation_m": 5.8},
            {"name": "Chidambaram Municipal Emergency Shelter", "type": "Relief Centre", "lat": 11.4020, "lon": 79.6910, "elevation_m": 6.4}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-CD-04", "name": "East Car Street / Temple North Gate", "lat": 11.3995, "lon": 79.6945, "water_depth_cm": 40, "status": "TEMPLE QUADRANGLE FLOODING", "pumps_active": 3, "capacity_hp": 160}
        ],
        "nearest_aws": "IMD Chidambaram AWS (Annamalai University)",
        "aws_distance_km": 1.2
    },
    {
        "id": "cuddalore_vadalur",
        "name": "Vadalur & Kurinjipadi Agricultural Plain",
        "district": "Cuddalore",
        "district_code": "CUD",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [11.5520, 79.5510],
        "bbox": [11.5300, 79.5250, 11.5740, 79.5770],
        "area_sqkm": 11.2,
        "type": "neighborhood",
        "vulnerability_profile": "Agrarian plain adjacent to Neyveli open-cast mine storm drainage; sudden torrential runoff inundates low-lying paddy tracts and Vallalar Sathya Gnana Sabai approach.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.5300, 11.5360],
                [79.5720, 11.5360],
                [79.5740, 11.5680],
                [79.5320, 11.5680],
                [79.5300, 11.5360]
            ]]
        },
        "critical_facilities": [
            {"name": "Vadalur Government Primary Health Centre", "type": "Hospital", "lat": 11.5510, "lon": 79.5500, "elevation_m": 22.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-CD-05", "name": "Cuddalore-Virudhachalam Highway Vadalur Jn", "lat": 11.5530, "lon": 79.5520, "water_depth_cm": 28, "status": "HIGHWAY SHEET FLOW", "pumps_active": 1, "capacity_hp": 80}
        ],
        "nearest_aws": "IMD Neyveli AWS",
        "aws_distance_km": 6.8
    },

    # =========================================================================
    # 4. TIRUVANNAMALAI (TVM)
    # =========================================================================
    {
        "id": "tvm_temple_precinct",
        "name": "Annamalaiyar Temple Precinct & Mada Streets",
        "district": "Tiruvannamalai",
        "district_code": "TVM",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [12.2280, 79.0680],
        "bbox": [12.2150, 79.0550, 12.2410, 79.0810],
        "area_sqkm": 4.2,
        "type": "neighborhood",
        "vulnerability_profile": "Historic township at eastern base of Mount Arunachala; steep mountain slopes discharge massive surface runoff directly into Car Streets and Temple Rajagopuram gates.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.0580, 12.2180],
                [79.0780, 12.2180],
                [79.0800, 12.2380],
                [79.0600, 12.2380],
                [79.0580, 12.2180]
            ]]
        },
        "critical_facilities": [
            {"name": "Arulmigu Arunachaleswarar Temple Emergency Post", "type": "Temple / Command Centre", "lat": 12.2275, "lon": 79.0675, "elevation_m": 172.0},
            {"name": "Tiruvannamalai Government District Hospital", "type": "Hospital", "lat": 12.2310, "lon": 79.0720, "elevation_m": 169.5}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-TVM-01", "name": "East Gopuram (Rajagopuram) Car Street", "lat": 12.2285, "lon": 79.0690, "water_depth_cm": 38, "status": "MOUNTAIN FLASH RUNOFF", "pumps_active": 2, "capacity_hp": 150}
        ],
        "nearest_aws": "IMD Tiruvannamalai Collectorate AWS",
        "aws_distance_km": 1.8
    },
    {
        "id": "tvm_girivalam",
        "name": "Girivalam Path & Hill Base Ring",
        "district": "Tiruvannamalai",
        "district_code": "TVM",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [12.2350, 79.0520],
        "bbox": [12.2100, 79.0250, 12.2600, 79.0800],
        "area_sqkm": 14.5,
        "type": "neighborhood",
        "vulnerability_profile": "14-km circular sacred path circling the holy hill; seasonal streams (odais) and temple theerthams swell during cyclonic storms, cutting across pedestrian walkways.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.0300, 12.2150],
                [79.0750, 12.2150],
                [79.0780, 12.2550],
                [79.0330, 12.2550],
                [79.0300, 12.2150]
            ]]
        },
        "critical_facilities": [
            {"name": "Girivalam Path Disaster Relief & Medical Post (Surya Lingam)", "type": "First Aid / Shelter", "lat": 12.2420, "lon": 79.0480, "elevation_m": 185.0},
            {"name": "Sri Ramanasramam Relief Hub", "type": "Heritage / Assembly", "lat": 12.2205, "lon": 79.0595, "elevation_m": 178.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-TVM-02", "name": "Adi Annamalai Causeway (Girivalam)", "lat": 12.2480, "lon": 79.0410, "water_depth_cm": 45, "status": "HILL STREAM OVERFLOW", "pumps_active": 2, "capacity_hp": 120}
        ],
        "nearest_aws": "IMD Tiruvannamalai AWS",
        "aws_distance_km": 2.9
    },
    {
        "id": "tvm_chengam_road",
        "name": "Chengam Road & Southern Urban Corridor",
        "district": "Tiruvannamalai",
        "district_code": "TVM",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [12.2150, 79.0580],
        "bbox": [12.1950, 79.0400, 12.2350, 79.0760],
        "area_sqkm": 6.8,
        "type": "neighborhood",
        "vulnerability_profile": "Rapidly urbanizing southern gateway; intercepts drainage towards Samudram and Thamarai kulam lake catchments, causing basement and shop waterlogging.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.0420, 12.2000],
                [79.0740, 12.2000],
                [79.0760, 12.2300],
                [79.0440, 12.2300],
                [79.0420, 12.2000]
            ]]
        },
        "critical_facilities": [
            {"name": "Tiruvannamalai South Fire & Rescue Station", "type": "Emergency Services", "lat": 12.2120, "lon": 79.0610, "elevation_m": 168.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-TVM-03", "name": "Chengam Road Junction / Mathalangulam", "lat": 12.2140, "lon": 79.0590, "water_depth_cm": 32, "status": "DRAINAGE SURCHARGE", "pumps_active": 2, "capacity_hp": 100}
        ],
        "nearest_aws": "IMD Tiruvannamalai AWS",
        "aws_distance_km": 3.4
    },
    {
        "id": "tvm_polur_gateway",
        "name": "Polur Gateway & Northern Industrial Fringe",
        "district": "Tiruvannamalai",
        "district_code": "TVM",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [12.2500, 79.0850],
        "bbox": [12.2320, 79.0680, 12.2680, 79.1020],
        "area_sqkm": 8.0,
        "type": "neighborhood",
        "vulnerability_profile": "Northern entry point adjacent to railway corridor and Cheyyar sub-catchments; low embankments lead to rail underpass submergence during storm peaks.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.0700, 12.2350],
                [79.1000, 12.2350],
                [79.1020, 12.2650],
                [79.0720, 12.2650],
                [79.0700, 12.2350]
            ]]
        },
        "critical_facilities": [
            {"name": "Tiruvannamalai Railway Station Yard", "type": "Railway Infrastructure", "lat": 12.2460, "lon": 79.0810, "elevation_m": 164.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-TVM-04", "name": "Polur Road Railway Level Crossing Subway", "lat": 12.2475, "lon": 79.0830, "water_depth_cm": 52, "status": "SUBWAY INUNDATED", "pumps_active": 3, "capacity_hp": 180}
        ],
        "nearest_aws": "IMD Tiruvannamalai Collectorate AWS",
        "aws_distance_km": 2.2
    },
    {
        "id": "tvm_cheyyar_basin",
        "name": "Cheyyar River Basin & Vettavalam",
        "district": "Tiruvannamalai",
        "district_code": "TVM",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [12.1800, 79.2500],
        "bbox": [12.1550, 79.2200, 12.2050, 79.2800],
        "area_sqkm": 12.0,
        "type": "neighborhood",
        "vulnerability_profile": "Cheyyar river floodplain receiving Sathanur Dam tailwater; substantial agricultural inundation and low-level causeway submergence during November squalls.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.2250, 12.1600],
                [79.2750, 12.1600],
                [79.2780, 12.2000],
                [79.2280, 12.2000],
                [79.2250, 12.1600]
            ]]
        },
        "critical_facilities": [
            {"name": "Cheyyar Basin PWD Sluice Gate Control", "type": "Water Resources", "lat": 12.1820, "lon": 79.2480, "elevation_m": 138.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-TVM-05", "name": "Vettavalam River Causeway", "lat": 12.1790, "lon": 79.2520, "water_depth_cm": 65, "status": "RIVER SPATE - TRAFFIC HALTED", "pumps_active": 2, "capacity_hp": 120}
        ],
        "nearest_aws": "IMD Cheyyar AWS",
        "aws_distance_km": 14.0
    },

    # =========================================================================
    # 5. MADURAI (MDU)
    # =========================================================================
    {
        "id": "madurai_vaigai",
        "name": "Madurai Vaigai Riverfront Corridor",
        "district": "Madurai",
        "district_code": "MDU",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [9.9252, 78.1198],
        "bbox": [9.8900, 78.0800, 9.9600, 78.1600],
        "area_sqkm": 10.8,
        "type": "neighborhood",
        "vulnerability_profile": "Vaigai river urban course traversing dense commercial core; sensitive to Vaigai Dam surplus releases and stormwater trunk drain backwater.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [78.0850, 9.8950],
                [78.1550, 9.8980],
                [78.1580, 9.9550],
                [78.0880, 9.9520],
                [78.0850, 9.8950]
            ]]
        },
        "critical_facilities": [
            {"name": "Madurai Government Rajaji Hospital", "type": "Hospital", "lat": 9.9320, "lon": 78.1310, "elevation_m": 136.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-MD-01", "name": "Simmakkal Causeway", "lat": 9.9270, "lon": 78.1230, "water_depth_cm": 40, "status": "RIVERBANK CAUTION", "pumps_active": 2, "capacity_hp": 150}
        ],
        "nearest_aws": "IMD Madurai Airport AWS",
        "aws_distance_km": 9.5
    },
    {
        "id": "mdu_meenakshi",
        "name": "Meenakshi Amman Temple Heritage Precinct",
        "district": "Madurai",
        "district_code": "MDU",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [9.9195, 78.1193],
        "bbox": [9.9100, 78.1100, 9.9290, 78.1280],
        "area_sqkm": 3.5,
        "type": "neighborhood",
        "vulnerability_profile": "Concentric historical temple city with ancient stone drainage; intense rain events create rapid ponding along Chithirai and Avani Moola street rings.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [78.1120, 9.9120],
                [78.1260, 9.9120],
                [78.1270, 9.9270],
                [78.1130, 9.9270],
                [78.1120, 9.9120]
            ]]
        },
        "critical_facilities": [
            {"name": "Arulmigu Meenakshi Sundareswarar Temple Command Post", "type": "Temple Complex", "lat": 9.9198, "lon": 78.1195, "elevation_m": 139.0},
            {"name": "Madurai City Corporation Central Headquarters", "type": "Administration", "lat": 9.9220, "lon": 78.1210, "elevation_m": 140.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-MD-02", "name": "South Tower (Therku Gopuram) Street", "lat": 9.9180, "lon": 78.1190, "water_depth_cm": 35, "status": "HERITAGE QUADRANGLE PONDING", "pumps_active": 2, "capacity_hp": 120}
        ],
        "nearest_aws": "IMD Madurai City AWS",
        "aws_distance_km": 1.2
    },
    {
        "id": "mdu_goripalayam",
        "name": "Goripalayam & Bibikulam Northern Hub",
        "district": "Madurai",
        "district_code": "MDU",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [9.9380, 78.1320],
        "bbox": [9.9250, 78.1200, 9.9510, 78.1450],
        "area_sqkm": 5.2,
        "type": "neighborhood",
        "vulnerability_profile": "Northern riverbank medical and institutional district; Vaigai river flood releases and arterial bridge choke points cause traffic gridlock and sub-grade ponding.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [78.1220, 9.9280],
                [78.1420, 9.9280],
                [78.1430, 9.9480],
                [78.1230, 9.9480],
                [78.1220, 9.9280]
            ]]
        },
        "critical_facilities": [
            {"name": "Madurai Government Rajaji Hospital (GRH)", "type": "Apex Hospital", "lat": 9.9320, "lon": 78.1310, "elevation_m": 136.0},
            {"name": "Madurai Medical College Disaster Relief Cell", "type": "Medical Relief", "lat": 9.9340, "lon": 78.1330, "elevation_m": 137.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-MD-03", "name": "Goripalayam Thevar Statue Junction", "lat": 9.9360, "lon": 78.1315, "water_depth_cm": 40, "status": "TRAFFIC JUNCTION INUNDATION", "pumps_active": 2, "capacity_hp": 150}
        ],
        "nearest_aws": "IMD Madurai Airport AWS",
        "aws_distance_km": 8.0
    },
    {
        "id": "mdu_mattuthavani",
        "name": "Mattuthavani & Vandiyur Lake Catchment",
        "district": "Madurai",
        "district_code": "MDU",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [9.9450, 78.1650],
        "bbox": [9.9280, 78.1480, 9.9620, 78.1820],
        "area_sqkm": 9.4,
        "type": "neighborhood",
        "vulnerability_profile": "Integrated transit terminal and expansive Vandiyur lake wetland; lake surplus discharge and Ring Road drainage blocks cause bus bay submergence.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [78.1500, 9.9320],
                [78.1800, 9.9320],
                [78.1810, 9.9580],
                [78.1510, 9.9580],
                [78.1500, 9.9320]
            ]]
        },
        "critical_facilities": [
            {"name": "M.G.R. Integrated Bus Terminus (Mattuthavani)", "type": "Transport Terminal", "lat": 9.9460, "lon": 78.1660, "elevation_m": 138.5},
            {"name": "Vandiyur Lake Surplus Sluice Regulating Weirs", "type": "Water Resources", "lat": 9.9380, "lon": 78.1610, "elevation_m": 135.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-MD-04", "name": "Mattuthavani Bus Bay 4 & 5", "lat": 9.9455, "lon": 78.1655, "water_depth_cm": 48, "status": "TERMINAL WATERLOGGING", "pumps_active": 3, "capacity_hp": 200}
        ],
        "nearest_aws": "IMD Madurai Airport AWS",
        "aws_distance_km": 11.2
    },
    {
        "id": "mdu_thiruparankundram",
        "name": "Thiruparankundram Temple Gateway",
        "district": "Madurai",
        "district_code": "MDU",
        "state": "Tamil Nadu",
        "state_code": "TN",
        "centroid": [9.8820, 78.0720],
        "bbox": [9.8650, 78.0550, 9.9000, 78.0900],
        "area_sqkm": 6.5,
        "type": "neighborhood",
        "vulnerability_profile": "Southern rocky hill gateway; massive flash runoff cascading down Thiruparankundram rock hill inundates station road and Saravana Poigai overflow canals.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [78.0580, 9.8700],
                [78.0860, 9.8700],
                [78.0870, 9.8950],
                [78.0590, 9.8950],
                [78.0580, 9.8700]
            ]]
        },
        "critical_facilities": [
            {"name": "Arulmigu Subramaniaswamy Temple Pilgrim Centre", "type": "Temple / Shelter", "lat": 9.8830, "lon": 78.0710, "elevation_m": 152.0},
            {"name": "Thiruparankundram Government Hospital", "type": "Hospital", "lat": 9.8810, "lon": 78.0740, "elevation_m": 148.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-MD-05", "name": "Saravana Poigai Tank Bypass Road", "lat": 9.8825, "lon": 78.0735, "water_depth_cm": 36, "status": "TANK OVERBANK OVERFLOW", "pumps_active": 2, "capacity_hp": 120}
        ],
        "nearest_aws": "IMD Madurai Airport AWS",
        "aws_distance_km": 5.4
    },

    # =========================================================================
    # 6. PUDUCHERRY URBAN (PDY)
    # =========================================================================
    {
        "id": "pdy_white_town",
        "name": "White Town & Promenade Beachfront",
        "district": "Puducherry Urban",
        "district_code": "PDY",
        "state": "Puducherry",
        "state_code": "PY",
        "centroid": [11.9330, 79.8350],
        "bbox": [11.9200, 79.8220, 11.9460, 79.8480],
        "area_sqkm": 3.8,
        "type": "neighborhood",
        "vulnerability_profile": "Heritage French Quarter hugging Bay of Bengal shoreline; vulnerable to cyclonic high-tide sea water overtopping the seawall and Grand Canal backwater overflow.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.8250, 11.9240],
                [79.8440, 11.9240],
                [79.8450, 11.9420],
                [79.8260, 11.9420],
                [79.8250, 11.9240]
            ]]
        },
        "critical_facilities": [
            {"name": "Puducherry Legislative Assembly Complex", "type": "Government Headquarters", "lat": 11.9335, "lon": 79.8340, "elevation_m": 5.2},
            {"name": "Indira Gandhi Government General Hospital", "type": "Hospital", "lat": 11.9360, "lon": 79.8305, "elevation_m": 5.8},
            {"name": "Goubert Seawall Marine Flood Barrier", "type": "Coastal Protection", "lat": 11.9320, "lon": 79.8365, "elevation_m": 4.1}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-PDY-01", "name": "Goubert Avenue Beach Promenade", "lat": 11.9315, "lon": 79.8360, "water_depth_cm": 45, "status": "TIDAL SURGE INUNDATION", "pumps_active": 3, "capacity_hp": 220},
            {"id": "WL-PDY-02", "name": "Grand Canal / Rangapillai Street Jn", "lat": 11.9345, "lon": 79.8280, "water_depth_cm": 35, "status": "CANAL SURCHARGE", "pumps_active": 2, "capacity_hp": 150}
        ],
        "nearest_aws": "IMD Puducherry Observatory (Lawspet)",
        "aws_distance_km": 2.5
    },
    {
        "id": "pdy_oulgaret",
        "name": "Oulgaret & Lawspet Urban Corridor",
        "district": "Puducherry Urban",
        "district_code": "PDY",
        "state": "Puducherry",
        "state_code": "PY",
        "centroid": [11.9600, 79.8100],
        "bbox": [11.9400, 79.7900, 11.9800, 79.8300],
        "area_sqkm": 8.5,
        "type": "neighborhood",
        "vulnerability_profile": "Densely inhabited municipal belt; low elevation and narrow drains heading to Bay of Bengal create prolonged waterlogging across residential colonies.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.7950, 11.9450],
                [79.8250, 11.9450],
                [79.8280, 11.9750],
                [79.7980, 11.9750],
                [79.7950, 11.9450]
            ]]
        },
        "critical_facilities": [
            {"name": "JIPMER Super Specialty Hospital", "type": "Hospital / Apex Medical", "lat": 11.9560, "lon": 79.7980, "elevation_m": 12.0},
            {"name": "Puducherry Airport Terminal", "type": "Aviation", "lat": 11.9680, "lon": 79.8120, "elevation_m": 8.5}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-PDY-03", "name": "Airport Road Lawspet", "lat": 11.9630, "lon": 79.8140, "water_depth_cm": 30, "status": "DRAINAGE RESTRICTION", "pumps_active": 2, "capacity_hp": 120}
        ],
        "nearest_aws": "IMD Puducherry Airport AWS",
        "aws_distance_km": 0.8
    },
    {
        "id": "pdy_villianur",
        "name": "Villianur Temple Basin & Sankaraparani River",
        "district": "Puducherry Urban",
        "district_code": "PDY",
        "state": "Puducherry",
        "state_code": "PY",
        "centroid": [11.9150, 79.7550],
        "bbox": [11.8950, 79.7350, 11.9350, 79.7750],
        "area_sqkm": 9.8,
        "type": "neighborhood",
        "vulnerability_profile": "Located in Sankaraparani (Gingee) river flood zone; excess water releases from Sathanur upstream sub-basins submerge river causeways and paddy fields.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.7400, 11.9000],
                [79.7700, 11.9000],
                [79.7720, 11.9300],
                [79.7420, 11.9300],
                [79.7400, 11.9000]
            ]]
        },
        "critical_facilities": [
            {"name": "Villianur Community Health Centre", "type": "Hospital", "lat": 11.9160, "lon": 79.7560, "elevation_m": 9.0},
            {"name": "Sankaraparani River Anicut Control Sluice", "type": "Flood Control", "lat": 11.9120, "lon": 79.7510, "elevation_m": 7.5}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-PDY-04", "name": "Villianur Low-Level Causeway", "lat": 11.9135, "lon": 79.7530, "water_depth_cm": 55, "status": "RIVER SPATE CAUTION", "pumps_active": 2, "capacity_hp": 140}
        ],
        "nearest_aws": "IMD Puducherry Observatory",
        "aws_distance_km": 7.5
    },
    {
        "id": "pdy_bahour",
        "name": "Bahour Lake & Agrarian Catchment",
        "district": "Puducherry Urban",
        "district_code": "PDY",
        "state": "Puducherry",
        "state_code": "PY",
        "centroid": [11.8050, 79.7450],
        "bbox": [11.7850, 79.7200, 11.8250, 79.7700],
        "area_sqkm": 14.0,
        "type": "neighborhood",
        "vulnerability_profile": "Puducherry's 'rice bowl' surrounding huge Bahour lake; lake overflow into Bangaru channel submerges surrounding rural village hamlets during monsoon squalls.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.7250, 11.7900],
                [79.7650, 11.7900],
                [79.7680, 11.8200],
                [79.7280, 11.8200],
                [79.7250, 11.7900]
            ]]
        },
        "critical_facilities": [
            {"name": "Bahour Lake Surplus Weir System", "type": "Water Resources", "lat": 11.8080, "lon": 79.7420, "elevation_m": 8.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-PDY-05", "name": "Bahour-Cuddalore Border Road", "lat": 11.8010, "lon": 79.7460, "water_depth_cm": 35, "status": "AGRARIAN INUNDATION", "pumps_active": 2, "capacity_hp": 100}
        ],
        "nearest_aws": "IMD AWS Cuddalore Port",
        "aws_distance_km": 6.2
    },

    # =========================================================================
    # 7. KARAIKAL (KRK)
    # =========================================================================
    {
        "id": "krk_port_coastal",
        "name": "Karaikal Port & Coastal Maritime Zone",
        "district": "Karaikal",
        "district_code": "KRK",
        "state": "Puducherry",
        "state_code": "PY",
        "centroid": [10.8400, 79.8550],
        "bbox": [10.8200, 79.8350, 10.8600, 79.8750],
        "area_sqkm": 7.5,
        "type": "neighborhood",
        "vulnerability_profile": "Deepwater maritime terminal and coastal mangrove spit; directly exposed to Bay of Bengal cyclonic tidal waves, sea water breach, and beach overwash.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.8400, 10.8250],
                [79.8700, 10.8250],
                [79.8720, 10.8550],
                [79.8420, 10.8550],
                [79.8400, 10.8250]
            ]]
        },
        "critical_facilities": [
            {"name": "Karaikal Port Emergency Operations Command", "type": "Maritime Command", "lat": 10.8420, "lon": 79.8570, "elevation_m": 4.2},
            {"name": "Keezhaiyur Multipurpose Cyclone Shelter", "type": "Cyclone Shelter", "lat": 10.8350, "lon": 79.8490, "elevation_m": 5.0}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-KRK-01", "name": "Port Access Highway & Breakwater Point", "lat": 10.8410, "lon": 79.8560, "water_depth_cm": 58, "status": "STORM SURGE WATERLOGGED", "pumps_active": 3, "capacity_hp": 250}
        ],
        "nearest_aws": "IMD Karaikal Port Observatory",
        "aws_distance_km": 1.5
    },
    {
        "id": "krk_arasalar_estuary",
        "name": "Arasalar River Estuary & Town Corridor",
        "district": "Karaikal",
        "district_code": "KRK",
        "state": "Puducherry",
        "state_code": "PY",
        "centroid": [10.9250, 79.8350],
        "bbox": [10.9100, 79.8150, 10.9400, 79.8550],
        "area_sqkm": 5.6,
        "type": "neighborhood",
        "vulnerability_profile": "Urban Karaikal core where Arasalar and Vanjiar rivers meet the Bay of Bengal; vulnerable to astronomical high tides pushing sea water back into city drains.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.8200, 10.9150],
                [79.8500, 10.9150],
                [79.8520, 10.9350],
                [79.8220, 10.9350],
                [79.8200, 10.9150]
            ]]
        },
        "critical_facilities": [
            {"name": "Karaikal General Hospital & Trauma Care", "type": "Hospital", "lat": 10.9260, "lon": 79.8320, "elevation_m": 4.8},
            {"name": "Karaikal Collectorate & Emergency Control Room", "type": "Command Hub", "lat": 10.9280, "lon": 79.8340, "elevation_m": 5.2}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-KRK-02", "name": "Beach Road / Arasalar Estuary Causeway", "lat": 10.9230, "lon": 79.8380, "water_depth_cm": 48, "status": "ESTUARY TIDAL BACKFLOW", "pumps_active": 3, "capacity_hp": 200}
        ],
        "nearest_aws": "IMD Karaikal Town AWS",
        "aws_distance_km": 0.9
    },
    {
        "id": "krk_thirunallar",
        "name": "Thirunallar Saneeswara Temple Precinct",
        "district": "Karaikal",
        "district_code": "KRK",
        "state": "Puducherry",
        "state_code": "PY",
        "centroid": [10.9320, 79.7900],
        "bbox": [10.9150, 79.7700, 10.9500, 79.8100],
        "area_sqkm": 6.2,
        "type": "neighborhood",
        "vulnerability_profile": "Famous pilgrim center situated along Nallar river tributary; high festival pilgrim density and Nalan Theertham sacred tank surplus flooding risk.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.7750, 10.9200],
                [79.8050, 10.9200],
                [79.8080, 10.9450],
                [79.7780, 10.9450],
                [79.7750, 10.9200]
            ]]
        },
        "critical_facilities": [
            {"name": "Sri Dharbaranyeswarar Temple Pilgrim Shelter", "type": "Relief Centre", "lat": 10.9315, "lon": 79.7910, "elevation_m": 6.5},
            {"name": "Thirunallar Government Primary Health Centre", "type": "Hospital", "lat": 10.9340, "lon": 79.7880, "elevation_m": 6.8}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-KRK-03", "name": "Nalan Theertham Ring Road", "lat": 10.9305, "lon": 79.7925, "water_depth_cm": 35, "status": "POND SURCHARGE", "pumps_active": 2, "capacity_hp": 100}
        ],
        "nearest_aws": "IMD Karaikal AWS",
        "aws_distance_km": 4.8
    },
    {
        "id": "krk_nedungadu",
        "name": "Nedungadu Deltaic Agricultural Plain",
        "district": "Karaikal",
        "district_code": "KRK",
        "state": "Puducherry",
        "state_code": "PY",
        "centroid": [10.9800, 79.7750],
        "bbox": [10.9600, 79.7500, 11.0000, 79.8000],
        "area_sqkm": 8.8,
        "type": "neighborhood",
        "vulnerability_profile": "Northern Karaikal tail-end Cauvery delta canal network; extensive paddy flatlands subject to prolonged water stagnancy when drainage outfalls to sea are choked.",
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [79.7550, 10.9650],
                [79.7950, 10.9650],
                [79.7980, 10.9950],
                [79.7580, 10.9950],
                [79.7550, 10.9650]
            ]]
        },
        "critical_facilities": [
            {"name": "Nedungadu Agricultural Co-op Relief Depot", "type": "Relief / Storage", "lat": 10.9780, "lon": 79.7740, "elevation_m": 7.2}
        ],
        "waterlogging_hotspots": [
            {"id": "WL-KRK-04", "name": "Nedungadu Canal Siphon Bridge", "lat": 10.9820, "lon": 79.7770, "water_depth_cm": 40, "status": "CANAL BREACH CAUTION", "pumps_active": 2, "capacity_hp": 120}
        ],
        "nearest_aws": "IMD Karaikal AWS",
        "aws_distance_km": 8.5
    }
]
