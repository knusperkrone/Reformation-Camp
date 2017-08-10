export class SQL_Veranstaltung {
    constructor(public Id: number, public Kürzel: string, public Name: string, public Sprache: string,
        public Jahr: string, public Dauer: string) { }
}

export class SQL_Instanz {
    constructor(public id: number, public Id_Veranstaltung: number, public StartDatum: string) { }
}

export class SQL_Termin {
    constructor(public Id_Veranstaltung: number, public Tag: number, public Uhrzeit: string,
        Titel: string, Typ: number) { }
}

export class SQL_Beschreibung {
    constructor(public Id_Veranstaltung: number, public Id_Instanz: number, public Termin_Tag: number,
        public Termin_Uhrzeit: string, public Text: string, Typ: string) { }
}

export class SQL_Text {
    constructor(public Id_Veranstaltung: number, public Sprache: string, public Titel: string) { }
}

export class SQL_Text_Tab {
    constructor(public Id_Veranstaltung: number, public Titel_Text: string, public Name: string, public Rang: number) { }
}

export class SQL_Tab_Inhalt {
    constructor(public Id_Veranstaltung: number, public Menu_Titel: string, Titel_Tab: string, Rang: number,
        public Typ: number, public Text: string) { }
}

export class JOINED_Termin {
    public static readonly query = ""
    + "SELECT "
    + "    Termin.Tag AS Tag, "
    + "    Termin.Uhrzeit AS Uhrzeit, "
    + "    Termin.Titel AS Titel, "
    + "    Beschreibung.Text AS Beschreibung, "
    + "    Beschreibung.Typ AS BeschreibungTyp, "
    + "    Termin.Typ AS TerminTyp "
    + "FROM Veranstaltung "

    + "JOIN Instanz "
    + "    ON Veranstaltung.Id == Instanz.Id_Veranstaltung "
    + "JOIN Termin "
    + "    ON Veranstaltung.Id == Termin.Id_Veranstaltung "
    + "LEFT JOIN Beschreibung "
    + "    ON Instanz.id = Beschreibung.Id_Instanz "
    + "AND Termin.Tag == Beschreibung.Termin_Tag "
    + "AND Termin.Uhrzeit == Beschreibung.Termin_Uhrzeit "

    + "WHERE Veranstaltung.Id == ? "
    + "    AND (Beschreibung.Id_Veranstaltung IS NULL OR Beschreibung.Id_Veranstaltung == ?) "
    + "    AND Instanz.Id == ? "
    + "    AND Veranstaltung.Jahr == ? "

    + "ORDER BY Termin.Tag, Termin.Uhrzeit, Beschreibung.Typ, Beschreibung.Text "

    public readonly details: JOINED_Beschreibung[] = [];
    public expanded: boolean = false;
    constructor(public Uhrzeit: string, public Titel: string, public TerminTyp: number) { }
}

export class JOINED_Beschreibung {
    constructor(public Beschreibung: string, public BeschreibungTyp: number) { }
}

export class JOINED_TabContent {
    public static readonly query = ""
    + "SELECT "
    + "    Kategorie_Tab_Titel.Titel AS Titel, "
    + "    Kategorie_Tab_Titel.Typ As TitelTyp, "
    + "    Kategorie_Tab_Titel.Rang as TitelRang, "
    + "    Kategorie_Tab_Text.Text AS Text, "
    + "    Kategorie_Tab_Text.Typ AS TextTyp "

    + "FROM Kategorie "
    + "LEFT JOIN Kategorie_Tab "
    + "    ON Kategorie_Tab.Name_Kategorie == Kategorie.Titel "
    + "LEFT JOIN Kategorie_Tab_Titel "
    + "    ON Kategorie_Tab_Titel.Name_Kategorie == Kategorie.Titel "
    + "    AND Kategorie_Tab_Titel.TabName_Kategorie_Tab == Kategorie_Tab.TabName "
    + "LEFT JOIN Kategorie_Tab_Text "
    + "    ON Kategorie_Tab_Text.Name_Kategorie == Kategorie.Titel "
    + "    AND Kategorie_Tab_Text.Id_Veranstaltung  == Kategorie_Tab.Id_Veranstaltung "
    + "    AND Kategorie_Tab_Text.TabName_Kategorie_Tab == Kategorie_Tab.TabName "
    + "    AND Kategorie_Tab_Text.Titel_Kategorie_Tab_Titel == Kategorie_Tab_Titel.Titel "

    + "WHERE Kategorie.Id_Veranstaltung == ? "
    + "    AND Kategorie_Tab.Id_Veranstaltung == ? "
    + "    AND Kategorie_Tab_Titel.Id_Veranstaltung == ? "
    + "    AND (Kategorie_Tab_Text.Id_Veranstaltung IS NULL OR Kategorie_Tab_Text.Id_Veranstaltung == ?)"
    + "    And Kategorie_Tab.TabName == ? "
    + "    AND Kategorie.Titel == ? "

    + "ORDER BY Kategorie.Titel, Kategorie_Tab.Rang, Kategorie_Tab_Titel.Rang, Kategorie_Tab_Text.Rang";

    constructor(public Text: string, public Type: number) { }

    expandend: boolean = false;
    texts: JOINED_TabContent[] = [];

}

export class ScheduleObject {
    public static readonly QUERY = "SELECT Titel, Tag, Uhrzeit, Typ FROM Termin WHERE Id_Veranstaltung == ? ORDER BY tag";
    constructor(public Titel: string, public Tag: number, public Uhrzeit: string, public Typ: number) { }
}
