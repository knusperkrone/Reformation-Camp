export module APIContract {


    export class DESRC_TYPE_ACCESS {
        // For program  classes
        public static readonly NOTE = 0;
        public static readonly MA_ONLY = 1;
        public static readonly ALL = 2;
    }

    export class TERMIN_TYPE {
        public static readonly MA = 0;
        public static readonly PROGRAMM = 1;
        public static readonly FREIWILLIG = 2;
        public static readonly AUFBAU = 3;
        public static readonly ESSEN = 4;
    };


    export class TEXT_TITEL_TYPE {
        public static readonly TITLE = 0;
    };

    export class TEXT_CONTENT_TYPE {
        public static readonly TEXT = 0;
        public static readonly SUB_HEADING = 1;
    };

}
