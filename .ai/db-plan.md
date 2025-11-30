<conversation_summary>
<decisions>

Użycie Supabase: dane uwierzytelniające użytkownika będą przechowywane w auth.users, a tabela aplikacyjna public.profiles będzie miała relację 1:1 z auth.users (profiles.user_id UUID PRIMARY KEY REFERENCES auth.users(id)).

Tabela dietary_preferences:

Relacja 1:1 z profiles (user_id UUID PRIMARY KEY REFERENCES profiles(user_id)).
Wiersz w dietary_preferences będzie automatycznie tworzony przy tworzeniu profilu (wszystkie pola mogą być NULL/“puste”), co reprezentuje brak ustawionych preferencji.
Dokładnie jeden rekord preferencji na użytkownika w MVP.
diet_type będzie typem ENUM w PostgreSQL.
allergies oraz disliked_ingredients będą przechowywane jako text[] (swobodne wartości).
Pola religious_restrictions i nutritional_goals nie będą częścią MVP.
Tabela recipes:

Kolumny minimum:
id UUID PRIMARY KEY
title TEXT NOT NULL
ingredients TEXT NOT NULL
instructions TEXT NOT NULL
owner_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
Ograniczenia:
CHECK (char_length(title) <= 200)
CHECK (char_length(ingredients) + char_length(instructions) <= 10000)
Użycie typu TEXT zamiast VARCHAR(n).
AI‑zmodyfikowane przepisy:

Wszystkie przepisy (oryginalne i AI) w jednej tabeli recipes.
Dodatkowe kolumny:
is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE
parent_recipe_id UUID NULL REFERENCES recipes(id) ON DELETE SET NULL (wskazuje oryginał przepisu).
Tabela recipe_ai_metadata z kolumnami:
recipe_id UUID PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE
owner_id UUID NOT NULL REFERENCES profiles(user_id)
explanation TEXT
model TEXT
provider TEXT
created_at TIMESTAMPTZ NOT NULL
generation_time TIMESTAMPTZ (czas generowania)
raw_response JSONB NULL
RLS w recipe_ai_metadata oparty na owner_id.
RLS:

Ścisłe per-user RLS na:
profiles
dietary_preferences
recipes
recipe_ai_metadata
Zasada: użytkownik widzi i modyfikuje tylko rekordy, gdzie owner_id = auth.uid() (lub odpowiednik po stronie profiles / dietary_preferences).
Klucze obce i zachowanie przy DELETE:

auth.users(id) → profiles(user_id): ON DELETE CASCADE
profiles(user_id) → dietary_preferences(user_id): ON DELETE CASCADE
profiles(user_id) → recipes(owner_id): ON DELETE CASCADE
recipes(id) → recipe_ai_metadata(recipe_id): ON DELETE CASCADE
recipes(parent_recipe_id) → recipes(id): ON DELETE SET NULL
Brak soft-delete — usuwanie ma być „hard delete” we wszystkich przypadkach.
Indeksy:

CREATE INDEX ON recipes(owner_id, created_at DESC) (lista przepisów użytkownika, sortowanie po dacie utworzenia).
CREATE INDEX ON recipes(parent_recipe_id) (wyszukiwanie przepisów pochodnych/AI).
Optymistyczna kontrola współbieżności:

Wykorzystanie kolumny updated_at TIMESTAMPTZ.
updated_at będzie utrzymywane przez trigger w bazie:
BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION set_timestamp() ustawiający NEW.updated_at = NOW().
Aplikacja przy aktualizacji przepisu używa WHERE id = $id AND updated_at = $old_updated_at i reaguje na brak zaktualizowanych wierszy.
Tytuły przepisów:

Mogą się powtarzać dla danego użytkownika.
Brak constraintu UNIQUE(owner_id, title).
Indeksy / zapytania po preferencjach dietetycznych:

Brak dodatkowych indeksów na dietary_preferences w MVP (brak planowanych zapytań przekrojowych po wielu użytkownikach na tym etapie).
Tabela zdarzeń / metryk:

Brak dedykowanej tabeli user_events / analitycznej w MVP.
Metryki będą w razie potrzeby wyliczane z istniejących tabel lub poza bazą.
AI operacje:

Wstawianie przepisów AI i rekordów w recipe_ai_metadata będzie realizowane z klienta (frontend) z użyciem sesji użytkownika i RLS.
Czas / strefy czasowe:

Wszystkie znaczniki czasu będą przechowywane jako TIMESTAMPTZ w UTC.
Brak kolumny time_zone w profiles w MVP (konwersja do strefy lokalnej będzie realizowana po stronie klienta, jeśli potrzebna).
Szyfrowanie:

Brak dodatkowego szyfrowania na poziomie kolumn (np. pgcrypto) dla preferencji dietetycznych i danych AI w MVP.
Poleganie na standardowym szyfrowaniu na poziomie platformy / dysku oraz na RLS.
</decisions>
<matched_recommendations>

Rozdzielenie danych uwierzytelniających (auth.users) i danych domenowych użytkownika (profiles) oraz zastosowanie relacji 1:1 zostało przyjęte zgodnie z rekomendacją, co upraszcza logikę i RLS.

Modelowanie preferencji dietetycznych:

Jeden rekord dietary_preferences na użytkownika.
Strukturalne pola (diet_type jako ENUM, listy jako text[]) oraz brak osobnego JSONB jako głównego nośnika danych — zgodnie z rekomendacją, z naciskiem na czytelność i walidowalność danych.
Skład tabeli recipes:

Oddzielenie ingredients i instructions w osobnych polach oraz użycie TEXT + CHECK zamiast VARCHAR(n) zostało przyjęte, co dobrze wspiera dalszy rozwój (np. parsowanie, lepsze UI).
Wspólny model dla przepisów oryginalnych i AI:

Użycie jednej tabeli recipes z is_ai_generated i parent_recipe_id dokładnie odpowiada wcześniejszej rekomendacji, upraszczając logikę aplikacji i obsługę list.
Osobna tabela recipe_ai_metadata:

Przechowywanie wyjaśnień, modelu, providera, raw_response JSONB i znaczników czasu w tabeli powiązanej 1:1 z przepisem (oraz z dodatkowym owner_id dla prostego RLS) jest bezpośrednią implementacją rekomendacji, aby nie „puchła” tabela recipes.
RLS per-user:

Zastosowanie polityk RLS opartych na owner_id = auth.uid() we wszystkich tabelach z danymi użytkownika jest zgodne z zaleceniem minimalnego zaufania i ograniczenia widoczności danych tylko do właściciela.
Indeksowanie:

Indeksy na (owner_id, created_at DESC) i na parent_recipe_id implementują zasugerowane minimalne, ale istotne indeksy dopasowane do głównych ścieżek zapytań.
Optymistyczna kontrola współbieżności:

Użycie updated_at (utrzymywanego przez trigger) w klauzuli WHERE update’ów odpowiada rekomendacji, aby nie wprowadzać dodatkowej kolumny version, a jednocześnie bezpiecznie obsłużyć edycję w wielu kartach.
Brak tabeli zdarzeń w MVP:

Choć rekomendowano lekką user_events, decyzja o jej pominięciu w MVP jest świadomym kompromisem prostoty nad łatwością liczenia metryk — zalecenie pozostaje istotne jako kierunek na przyszłość.
Rezygnacja z szyfrowania kolumnowego:

Zgodnie z rekomendacją traktowania danych jako wrażliwych przede wszystkim przez RLS i kontrolę dostępu, zdecydowano się nie dodawać dodatkowego szyfrowania na poziomie kolumn w MVP, pozostawiając tę opcję na późniejsze etapy (jeśli pojawią się wymagania regulacyjne).
</matched_recommendations>

<database_planning_summary>
a. Główne wymagania dotyczące schematu bazy danych

Na podstawie PRD i decyzji:

System ma obsługiwać:
Autoryzację / uwierzytelnianie użytkownika (realizowane przez Supabase auth).
Profil użytkownika oraz preferencje dietetyczne (w tym wielokrotne typy diet, alergie i nielubiane składniki).
Zarządzanie przepisami (tworzenie, odczyt, edycja, usuwanie).
AI‑modyfikacje przepisów oparte na profilu dietetycznym użytkownika, w tym przechowywanie zarówno zmodyfikowanych przepisów, jak i metadanych wyjaśnień.
Prywatność danych: użytkownicy widzą wyłącznie własne przepisy i preferencje.
Wymagania niefunkcjonalne obejmują:
Czytelny model danych (łatwa rozbudowa po MVP).
Bezpieczeństwo poprzez RLS.
Wystarczającą wydajność dla standardowych operacji (listowanie, odczyt przepisu, zapis przepisu, wywołanie AI).
b. Kluczowe encje i ich relacje

auth.users (Supabase)

Źródło prawdy dla tożsamości użytkownika (e-mail, hasło, odzyskiwanie hasła itd.).
id UUID jest kluczem głównym używanym w relacjach aplikacyjnych.
profiles

Relacja 1:1 z auth.users:
user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE.
Przechowuje dane aplikacyjne o użytkowniku (ustalone i rozszerzalne w kolejnych etapach).
Służy jako punkt odniesienia dla większości relacji domenowych i RLS.
dietary_preferences

Relacja 1:1 z profiles:
user_id UUID PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE.
Rekord tworzony automatycznie z profilem (pola mogą być NULL/„puste” przy starcie).
Kluczowe pola:
diet_type (PostgreSQL ENUM, np. vegan, vegetarian, keto, paleo, omnivore, itp.).
allergies text[] (lista alergii w dowolnym formacie).
disliked_ingredients text[] (lista nielubianych składników).
Dane te będą używane do budowy promptów dla modeli AI.
recipes

Kluczowa encja do przechowywania przepisów:
id UUID PRIMARY KEY
owner_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE
title TEXT NOT NULL
ingredients TEXT NOT NULL
instructions TEXT NOT NULL
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE
parent_recipe_id UUID NULL REFERENCES recipes(id) ON DELETE SET NULL
Ograniczenia:
Długość tytułu max 200 znaków.
Łączna długość ingredients + instructions max 10 000 znaków.
Relacje:
Każdy przepis należy do jednego użytkownika (owner_id).
AI‑zmodyfikowane przepisy mogą wskazywać oryginał przez parent_recipe_id.
Indeksy:
Po owner_id, created_at DESC dla szybkiego listowania przepisów użytkownika.
Po parent_recipe_id dla szybkiego znaleźć warianty AI danego przepisu.
recipe_ai_metadata

Tabela wspierająca AI:
recipe_id UUID PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE
owner_id UUID NOT NULL REFERENCES profiles(user_id)
explanation TEXT (opis zmian wprowadzonych przez AI).
model TEXT
provider TEXT
created_at TIMESTAMPTZ NOT NULL
generation_time TIMESTAMPTZ
raw_response JSONB NULL (surowa odpowiedź modelu, jeśli jest potrzebna).
Relacje:
Dokładnie jeden rekord metadanych na przepis AI (dla przepisów wygenerowanych; oryginały mogą nie mieć wpisu).
owner_id odzwierciedla właściciela przepisu, co upraszcza RLS.
c. Ważne kwestie dotyczące bezpieczeństwa i skalowalności

Bezpieczeństwo (RLS):

Wszystkie tabele z danymi „per user” będą chronione RLS:
Wzorce typu: CREATE POLICY ... ON recipes FOR SELECT USING (owner_id = auth.uid()); ... FOR UPDATE/DELETE USING (owner_id = auth.uid()); oraz odpowiedniki dla profiles, dietary_preferences, recipe_ai_metadata.
Operacje z poziomu frontendu będą korzystały wyłącznie z sesji użytkownika, bez kluczy service-role.
Brak dodatkowego szyfrowania kolumnowego — bezpieczeństwo opiera się na RLS, kontrolowanym dostępie i infrastrukturze.
Skalowalność i wydajność:

Użycie indeksu (owner_id, created_at DESC) zapewnia wydajne listowanie przepisów użytkownika (typowa operacja po zalogowaniu).
Indeks na parent_recipe_id obsłuży ewentualne UI porównujące oryginał i warianty AI.
Brak dodatkowych indeksów na dietary_preferences w MVP obniża koszty zapisu i upraszcza schemat; można je łatwo dodać w przyszłości, jeśli pojawią się zapytania przekrojowe.
Brak partycjonowania — wolumen danych w MVP nie wymaga złożonej strategii skalowania. Architektura jest jednak na tyle prosta, że późniejsze partycjonowanie (np. po dacie) będzie możliwe.
Integralność danych:

Spójne użycie kluczy obcych z ON DELETE CASCADE i ON DELETE SET NULL zapewnia brak sierocych rekordów oraz sensowne zachowanie po usunięciu użytkownika lub przepisu.
CHECK constraints na długość pól tekstowych wspierają wymagania biznesowe i zapobiegają zbyt dużym rekordom.
Optymistyczna kontrola współbieżności na bazie updated_at minimalizuje ryzyko utraty danych przy edycji w wielu kartach, zgodnie z user story US‑027.
Czas i strefy czasowe:

Wszystkie znaczniki czasu (created_at, updated_at, generation_time) przechowywane są jako TIMESTAMPTZ w UTC, co upraszcza logikę i pozwala frontowi na dowolną prezentację.
d. Obszary wymagające szczególnego uwzględnienia w dalszych etapach

Dokładne zdefiniowanie wartości diet_type ENUM (lista i ewentualne rozszerzenia w przyszłości).
Zaprojektowanie pełnych polityk RLS (osobno dla SELECT, INSERT, UPDATE, DELETE) oraz ewentualnego trybu „admin/service”, jeśli pojawi się potrzeba zarządzania danymi globalnie.
Ewentualne dodanie mechanizmu logowania błędów z usług AI (osobna tabela ai_error_logs lub podobna), co może być potrzebne do spełnienia wymagań US‑020 (logowanie błędów) w sposób systematyczny.
Dalsze doprecyzowanie zawartości tabeli profiles (np. pola UI, flagi onboardingowe), aby jasno oddzielić dane biznesowe od stricte technicznych.
</database_planning_summary>

<unresolved_issues>

Zakres i wartości ENUM dla diet_type

Należy doprecyzować pełną listę wartości (np. omnivore, vegetarian, vegan, pescatarian, keto, paleo, low_carb, inne?) oraz czy dopuszczalne są wartości „inne/unknown”.
Szczegółowa struktura tabeli profiles

Nie ustalono ostatecznego zestawu kolumn (np. display_name, kopiowana email, flagi onboardingowe, pola pod metryki).
Warto doprecyzować, które informacje (poza user_id) będą potrzebne w MVP.
Projekt szczegółowych polityk RLS

Wymagane jest skonkretyzowanie:
Dokładnych reguł dla SELECT/INSERT/UPDATE/DELETE na każdej tabeli.
Ewentualnych wyjątków (np. dla funkcji administracyjnych czy narzędzi do migracji).
Logowanie błędów AI / technicznych

PRD zakłada logowanie błędów (US‑020), ale nie zaprojektowano osobnej tabeli ani struktury dla logów błędów AI lub błędów technicznych.
Warto zdecydować, czy w MVP wystarczą logi infrastrukturalne, czy potrzebny jest prosty model tabeli logów.
Limity rozmiaru dla raw_response i explanation

Brak ustalonych limitów długości dla wyjaśnień oraz surowych odpowiedzi AI.
Warto rozważyć sensowne ograniczenia (np. przycięcie odpowiedzi po stronie aplikacji) lub CHECK/monitoring, aby unikać bardzo dużych rekordów.
</unresolved_issues>
</conversation_summary>