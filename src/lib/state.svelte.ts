export interface State {
    user: {
        username: string;
    } | null;

    loading: boolean;
}

const state: State = $state({
    user: null,
    loading: true,
});

export default state;